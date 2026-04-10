# CEISCaramulo for cPanel Node.js

This folder is a cPanel-oriented copy of the project, prepared for deployment through **cPanel Application Manager** with:

- a Node.js startup file at `app.js`
- a custom Next.js server in `server.js`
- Prisma + PostgreSQL configuration ready for cPanel
- runtime admin authentication suitable for server mode on cPanel
- environment examples specific to cPanel

## Recommended architecture on cPanel

Use this folder in **server mode**, not static export, because the application contains:

- authenticated backoffice routes
- Prisma database access
- admin APIs
- file uploads

Static export can still be used for a public-only build, but it is not the correct target for the full CMS/backoffice version.

## Files that matter for cPanel

- `app.js`
- `server.js`
- `.env.cpanel.example`
- `package.json`
- `prisma/schema.prisma`
- `prisma/migrations/*`

## Step-by-step cPanel deployment

### 1. Create the application folder

Inside your cPanel home, create a folder such as:

- `ceiscaramulo-node`

Upload the entire contents of this `cpanel-node-app` folder there.

### 2. Create the PostgreSQL database in cPanel

In cPanel:

1. Open **PostgreSQL Database Wizard**.
2. Create a database.
3. Create a database user.
4. Add the user to the database with all required privileges.
5. Note the final names. cPanel usually prefixes them with your account name.

Typical result:

- database: `cpaneluser_ceisdb`
- user: `cpaneluser_ceisapp`

### 3. Prepare the environment variables

Use `.env.cpanel.example` as your template.

Minimum variables:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
NEXT_OUTPUT_MODE=server
NEXT_PUBLIC_API_BASE_URL=https://ceiscaramulo.seudominio.com
DATABASE_URL=postgresql://cpaneluser_dbuser:PASSWORD@localhost:5432/cpaneluser_dbname?schema=public
DATABASE_URL_UNPOOLED=postgresql://cpaneluser_dbuser:PASSWORD@localhost:5432/cpaneluser_dbname?schema=public
ADMIN_EMAILS=admin@seudominio.com
ADMIN_AUTH_SECRET=troque-esta-chave-por-uma-chave-longa
ADMIN_AUTH_PASSWORD=troque-esta-password
NEXT_PUBLIC_ADMIN_AUTH_MODE=runtime
```

### 4. Register the app in cPanel Application Manager

In cPanel:

1. Open **Application Manager**.
2. Click **Create Application**.
3. Choose the domain or subdomain.
4. Set the application path to the uploaded folder.
5. Set the startup file to `app.js`.
6. Choose **Production**.
7. Add the environment variables from step 3.
8. Deploy the application.

### 5. Install dependencies

In Application Manager, use **Enable Dependencies**.

If terminal access is available, run:

```bash
npm install
```

### 6. Generate Prisma client and run migrations

If terminal access is available in cPanel:

```bash
cd ~/ceiscaramulo-node
npx prisma generate
npx prisma migrate deploy
```

If you cannot run migrations in cPanel, run them from your local machine against the same production database before the first launch.

### 7. Build the application

Run:

```bash
npm run build
```

### 8. Start or restart the application

In Application Manager:

- click **Restart**

If the app fails, check:

- the application log
- missing environment variables
- database connection string
- Prisma migration state

### 9. Configure the domain

If using the root domain:

- point the domain/subdomain in cPanel to the Node.js application through Application Manager

If using a subdomain, for example:

- `admin.seudominio.com`

create the subdomain first in cPanel, then attach it to the Node.js application.

### 10. Verify the application

Check:

- `/api/health`
- `/`
- `/backoffice/login`

Then log in with:

- an email listed in `ADMIN_EMAILS`
- the password in `ADMIN_AUTH_PASSWORD`

## PostgreSQL notes for cPanel

- local cPanel PostgreSQL usually uses `localhost`
- database names and usernames are usually prefixed
- after creating users/tables, cPanel recommends synchronizing grants in PostgreSQL tools
- if your host provides remote PostgreSQL instead of local PostgreSQL, update `DATABASE_URL` accordingly

## Auth recommendation

For the full cPanel Node.js deployment, the project is already prepared to use the built-in runtime admin auth.

If you later want to move to an external auth provider with stronger user lifecycle management, the best fit is usually:

- Supabase Auth for a hosted auth backend with client SDKs

But for this cPanel deployment, the current runtime auth is the most direct and compatible option.

## Domain checklist

- domain or subdomain created in cPanel
- Node.js app registered in Application Manager
- `NEXT_PUBLIC_API_BASE_URL` matches the final HTTPS URL
- SSL enabled for the domain
- app restarted after every env change

## Helpful commands

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start:cpanel
```
