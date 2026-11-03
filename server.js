const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!file.startsWith(root)) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
    res.end(data);
  });
}).listen(8000, '127.0.0.1');
