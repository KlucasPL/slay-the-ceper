/**
 * Minimal static file server for E2E tests — serves a directory over HTTP.
 * Usage: node scripts/static-server.js <dir> <port>
 */
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.jsonl': 'application/x-ndjson; charset=utf-8',
};

const root = process.argv[2] ?? '.';
const port = parseInt(process.argv[3] ?? '5174', 10);

createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = join(root, urlPath);

  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) throw new Error('not a file');
    const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static server listening on http://localhost:${port}\n`);
});
