export function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i.exec(dataUrl.trim());

  if (!match) {
    return null;
  }

  const mimeType = match[1] || 'application/octet-stream';
  const payload = match[2];

  try {
    const buffer = Buffer.from(payload, 'base64');
    return { mimeType, buffer };
  } catch {
    return null;
  }
}
