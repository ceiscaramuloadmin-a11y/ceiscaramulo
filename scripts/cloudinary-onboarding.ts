#!/usr/bin/env -S node --experimental-strip-types

const { v2: cloudinary } = require('cloudinary');

const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME', // <- replace this
  api_key: process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY', // <- replace this
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET', // <- replace this
};

const sampleImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

async function main(): Promise<void> {
  cloudinary.config(config);

  const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
    folder: 'codex-onboarding',
    public_id: `sample-${Date.now()}`,
    overwrite: false,
  });

  console.log('Uploaded image secure URL:');
  console.log(uploadResult.secure_url);
  console.log('Uploaded image public ID:');
  console.log(uploadResult.public_id);

  const details = await cloudinary.api.resource(uploadResult.public_id);

  console.log('Image details:');
  console.log(`Width: ${details.width}`);
  console.log(`Height: ${details.height}`);
  console.log(`Format: ${details.format}`);
  console.log(`File size bytes: ${details.bytes}`);

  const transformedUrl = cloudinary.url(uploadResult.public_id, {
    secure: true,
    // f_auto lets Cloudinary choose the best image format for the browser.
    fetch_format: 'auto',
    // q_auto lets Cloudinary choose an efficient quality level automatically.
    quality: 'auto',
  });

  console.log('Done! Click link below to see optimized version of the image. Check the size and the format.');
  console.log(transformedUrl);
}

main().catch((error: unknown) => {
  console.error('Cloudinary onboarding script failed.');
  console.error(error);
  process.exitCode = 1;
});
