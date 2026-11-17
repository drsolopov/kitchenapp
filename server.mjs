import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4401);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const abs = path.resolve(ROOT, `.${rel}`);
  const relative = path.relative(ROOT, abs);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403).end('forbidden'); return; }
  try {
    const data = await fs.readFile(abs);
    res.writeHead(200, { 'content-type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found: ' + rel);
  }
});
let currentPort = PORT;
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && !process.env.PORT && currentPort < PORT + 20) {
    currentPort += 1;
    console.warn(`port ${currentPort - 1} is busy; trying ${currentPort}`);
    server.listen(currentPort, '127.0.0.1');
    return;
  }
  console.error(`could not start KitchenCoach on port ${currentPort}: ${error.message}`);
  process.exit(1);
});
server.listen(currentPort, '127.0.0.1', () => console.log(`kitchencoach app http://127.0.0.1:${currentPort}`));
