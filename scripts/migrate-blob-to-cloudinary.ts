#!/usr/bin/env -S node --experimental-strip-types

import { config as loadEnv } from 'dotenv';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, posix } from 'node:path';
import { get, list, type ListBlobResultBlob } from '@vercel/blob';
import pg from 'pg';
import { uploadBufferToCloudinary } from '../lib/cloudinary-storage.ts';

type Mapping = {
  pathname: string;
  relativePath: string;
  blobUrl: string;
  blobDownloadUrl: string;
  cloudinaryUrl: string;
  bytes: number;
};

type Failure = {
  pathname: string;
  reason: string;
};

const dryRun = process.argv.includes('--dry-run');
const onlyFailed = process.argv.includes('--only-failed');
const reportPath = '.tmp/cloudinary-migration-report.json';
const cloudinaryFileLimitBytes = 100 * 1024 * 1024;
const compressedVideoTargetBytes = 95 * 1024 * 1024;
const requireFromHere = createRequire(import.meta.url);

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

function normalizePrismaConnectionString(value: string) {
  try {
    const url = new URL(value);
    const sslMode = url.searchParams.get('sslmode');

    if (sslMode === 'prefer' || sslMode === 'require' || sslMode === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full');
      return url.toString();
    }
  } catch {
    return value;
  }

  return value;
}

function requireConnectionString() {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.PRISMA_DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL, POSTGRES_URL ou PRISMA_DATABASE_URL e obrigatoria para atualizar referencias.');
  }

  return normalizePrismaConnectionString(connectionString);
}

function requireBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN e obrigatoria para ler ficheiros do Vercel Blob.');
  }

  return token;
}

function createPgPool() {
  return new pg.Pool({
    connectionString: requireConnectionString(),
  });
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

function isVideoBlob(pathname: string, contentType: string | null | undefined) {
  return Boolean(contentType?.startsWith('video/')) || /\.(m4v|mov|mp4|webm)$/i.test(pathname);
}

function resolveFfmpegPath() {
  const configured = process.env.FFMPEG_PATH?.trim();

  if (configured) {
    return configured;
  }

  try {
    return requireFromHere('ffmpeg-static') as string | null;
  } catch {
    return null;
  }
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile(resolveFfmpegPath() || 'ffmpeg', args, { maxBuffer: 10 * 1024 * 1024 }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve();
    });
  });
}

async function compressVideoForCloudinary(relativePath: string, buffer: Buffer) {
  const ffmpegPath = resolveFfmpegPath();

  if (!ffmpegPath) {
    throw new Error('Ficheiro excede 100 MB e ffmpeg nao esta disponivel para comprimir.');
  }

  const tempBase = join('.tmp', 'cloudinary-video-compression', randomUUID());
  const inputPath = `${tempBase}-input.mp4`;
  const attempts = [
    { crf: '28', width: '1280' },
    { crf: '32', width: '960' },
    { crf: '36', width: '854' },
  ];

  await mkdir(dirname(inputPath), { recursive: true });
  await writeFile(inputPath, buffer);

  try {
    for (const attempt of attempts) {
      const outputPath = `${tempBase}-crf-${attempt.crf}.mp4`;

      await rm(outputPath, { force: true });
      await runFfmpeg([
        '-y',
        '-i',
        inputPath,
        '-vf',
        `scale='min(${attempt.width},iw)':-2`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        attempt.crf,
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        outputPath,
      ]);

      const compressed = await readFile(outputPath);
      await rm(outputPath, { force: true });

      if (compressed.byteLength <= compressedVideoTargetBytes) {
        console.log(`Compressed ${relativePath} from ${buffer.byteLength} to ${compressed.byteLength} bytes`);
        return compressed;
      }
    }
  } finally {
    await rm(inputPath, { force: true });
  }

  throw new Error('Nao foi possivel comprimir o video abaixo do limite de 100 MB do Cloudinary.');
}

async function listBackofficeBlobs() {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({
      prefix: 'backoffice/',
      limit: 1000,
      cursor,
      token: requireBlobToken(),
    });

    blobs.push(...page.blobs);
    cursor = page.cursor;
  } while (cursor);

  if (!onlyFailed) {
    return blobs;
  }

  const report = JSON.parse(await readFile(reportPath, 'utf8')) as { failures?: Failure[] };
  const failedPathnames = new Set((report.failures || []).map((failure) => failure.pathname));

  return blobs.filter((blob) => failedPathnames.has(blob.pathname));
}

async function getBlobContent(pathname: string) {
  const token = requireBlobToken();
  const privateBlob = await get(pathname, { access: 'private', token });

  if (privateBlob?.statusCode === 200) {
    return privateBlob;
  }

  const publicBlob = await get(pathname, { access: 'public', token });

  if (publicBlob?.statusCode === 200) {
    return publicBlob;
  }

  return null;
}

function replacementsFor(mapping: Mapping) {
  return [
    mapping.blobUrl,
    mapping.blobDownloadUrl,
    `/uploads/backoffice/${mapping.relativePath}`,
    `blob-private:${mapping.relativePath}`,
  ].filter((value, index, all) => value && all.indexOf(value) === index);
}

function replaceKnownStorageValues(value: string | null | undefined, mappings: Mapping[]) {
  if (!value) {
    return value;
  }

  let updated = value;

  for (const mapping of mappings) {
    for (const oldValue of replacementsFor(mapping)) {
      updated = updated.split(oldValue).join(mapping.cloudinaryUrl);
    }
  }

  return updated;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function tableExists(pool: pg.Pool, tableName: string) {
  const result = await pool.query<{ exists: boolean }>(
    "select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = $1) as exists",
    [tableName]
  );

  return Boolean(result.rows[0]?.exists);
}

async function updateContentReferences(pool: pg.Pool, mappings: Mapping[]) {
  const changes: string[] = [];

  const updateTableRows = async (tableName: string, fields: string[]) => {
    if (!(await tableExists(pool, tableName))) {
      return;
    }

    const rows = await pool.query(`select id, ${fields.map((field) => `"${field}"`).join(', ')} from "${tableName}"`);

    for (const row of rows.rows) {
      const data: Record<string, unknown> = {};

      for (const field of fields) {
        const current = row[field];

        if (typeof current !== 'string') {
          continue;
        }

        const updated = replaceKnownStorageValues(current, mappings);

        if (updated !== current) {
          data[field] = updated;
        }
      }

      if (Object.keys(data).length > 0) {
        if (!dryRun) {
          const assignments = Object.keys(data).map((field, index) => `"${field}" = $${index + 2}`);
          await pool.query(
            `update "${tableName}" set ${assignments.join(', ')} where id = $1`,
            [row.id, ...Object.values(data)]
          );
        }
        changes.push(`${tableName}:${row.id}:${Object.keys(data).join(',')}`);
      }
    }
  };

  await updateTableRows('news', ['image', 'content']);
  await updateTableRows('activities', ['image', 'description']);
  await updateTableRows('publications', ['downloadUrl', 'coverImage', 'description']);
  await updateTableRows('gallery_media', ['source', 'thumbnail']);

  const siteSettings = (await pool.query<{ key: string; value: string }>('select key, value from "site_settings"')).rows;

  for (const setting of siteSettings) {
    let updated = replaceKnownStorageValues(setting.value, mappings);

    if (setting.key.startsWith('upload:backoffice:')) {
      const relativePath = setting.key.slice('upload:backoffice:'.length);
      const mapping = mappings.find((item) => item.relativePath === relativePath);

      if (mapping) {
        updated = `cloudinary:${mapping.cloudinaryUrl}`;
      }
    }

    if (updated !== setting.value) {
      if (!dryRun) {
        await pool.query('update "site_settings" set value = $2 where key = $1', [setting.key, updated]);
      }
      changes.push(`siteSetting:${setting.key}`);
    }
  }

  for (const mapping of mappings) {
    if (!dryRun) {
      await pool.query(
        `insert into "site_settings" (id, key, value)
         values ($1, $2, $3)
         on conflict (key) do update set value = excluded.value`,
        [`cmig_${randomUUID().replace(/-/g, '')}`, `upload:backoffice:${mapping.relativePath}`, `cloudinary:${mapping.cloudinaryUrl}`]
      );
    }
  }

  const siteLayouts = (await tableExists(pool, 'site_layouts'))
    ? (await pool.query<{ id: string; value: unknown }>('select id, value from "site_layouts"')).rows
    : [];

  for (const layout of siteLayouts) {
    const current = JSON.stringify(layout.value);
    const updated = replaceKnownStorageValues(current, mappings);

    if (updated !== current) {
      if (!dryRun) {
        await pool.query('update "site_layouts" set value = $2::jsonb where id = $1', [
          layout.id,
          JSON.stringify(JSON.parse(updated)),
        ]);
      }
      changes.push(`siteLayout:${layout.id}`);
    }
  }

  return changes;
}

async function migrateBlob(blob: ListBlobResultBlob): Promise<{ mapping?: Mapping; failure?: Failure }> {
  try {
    const relativePath = blob.pathname.replace(/^backoffice\//, '');

    if (dryRun) {
      return {
        mapping: {
          pathname: blob.pathname,
          relativePath,
          blobUrl: blob.url,
          blobDownloadUrl: blob.downloadUrl,
          cloudinaryUrl: `dry-run:${posix.join('backoffice', relativePath)}`,
          bytes: blob.size || 0,
        },
      };
    }

    const content = await getBlobContent(blob.pathname);

    if (!content || content.statusCode !== 200) {
      return { failure: { pathname: blob.pathname, reason: 'Blob nao encontrado para leitura.' } };
    }

    const buffer = await streamToBuffer(content.stream);
    const uploadBuffer =
      buffer.byteLength > cloudinaryFileLimitBytes && isVideoBlob(blob.pathname, content.blob.contentType)
        ? await compressVideoForCloudinary(relativePath, buffer)
        : buffer;
    const uploaded = await uploadBufferToCloudinary({
      relativePath,
      buffer: uploadBuffer,
      contentType: uploadBuffer === buffer ? content.blob.contentType || 'application/octet-stream' : 'video/mp4',
    });

    if (!uploaded?.publicUrl) {
      return { failure: { pathname: blob.pathname, reason: 'Cloudinary nao devolveu URL.' } };
    }

    return {
      mapping: {
        pathname: blob.pathname,
        relativePath,
        blobUrl: blob.url,
        blobDownloadUrl: blob.downloadUrl,
        cloudinaryUrl: uploaded.publicUrl,
        bytes: buffer.byteLength,
      },
    };
  } catch (error) {
    return {
      failure: {
        pathname: blob.pathname,
        reason: errorMessage(error),
      },
    };
  }
}

async function main() {
  const pool = createPgPool();

  try {
    const blobs = await listBackofficeBlobs();
    const mappings: Mapping[] = [];
    const failures: Failure[] = [];

    for (const blob of blobs) {
      const result = await migrateBlob(blob);

      if (result.mapping) {
        mappings.push(result.mapping);
        console.log(`Copied ${result.mapping.pathname} -> ${result.mapping.cloudinaryUrl}`);
      }

      if (result.failure) {
        failures.push(result.failure);
        console.error(`Failed ${result.failure.pathname}: ${result.failure.reason}`);
      }
    }

    const referenceChanges = await updateContentReferences(pool, mappings);
    const report = {
      dryRun,
      generatedAt: new Date().toISOString(),
      totalBlobFiles: blobs.length,
      copiedFiles: mappings.length,
      failedFiles: failures.length,
      copiedBytes: mappings.reduce((total, item) => total + item.bytes, 0),
      referenceChanges,
      failures,
      mappings,
    };

    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`Migration report written to ${reportPath}`);
    console.log(`Copied files: ${mappings.length}/${blobs.length}`);
    console.log(`Failed files: ${failures.length}`);
    console.log(`Reference changes: ${referenceChanges.length}`);

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
