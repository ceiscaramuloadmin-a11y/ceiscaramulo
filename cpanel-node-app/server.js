const http = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '3000', 10);

const app = next({
  dev,
  hostname,
  port,
  dir: __dirname,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => handle(req, res))
      .listen(port, hostname, () => {
        console.log(`CEISCaramulo cPanel app listening on http://${hostname}:${port}`);
      });
  })
  .catch((error) => {
    console.error('Failed to start cPanel Node.js application:', error);
    process.exit(1);
  });
