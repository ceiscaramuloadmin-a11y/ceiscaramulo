const required = [
  'NODE_ENV',
  'DATABASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'ADMIN_AUTH_SECRET',
  'ADMIN_AUTH_PASSWORD',
];

for (const key of required) {
  const value = process.env[key];
  console.log(`${key}=${value ? '[defined]' : '[missing]'}`);
}
