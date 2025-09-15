#!/usr/bin/env node
/*
  Lightweight Mobile Log Server (no external deps)
  - Accepts POST /log with JSON (single object or array of objects)
  - Writes JSONL to ./mobile-logs.jsonl
  - Prints concise lines to stdout
  - CORS enabled for all origins
  - Health check at GET /health

  Start: node scripts/mobile-log-server.js [port]
  Default port: 3001
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 3001;
const LOG_PATH = path.resolve(process.cwd(), 'mobile-logs.jsonl');

function send(res, code, body, headers = {}) {
  res.writeHead(code, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }, headers));
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function toArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

function short(s, n = 160) {
  try { s = String(s); } catch (_) { s = '[unprintable]'; }
  if (s.length > n) return s.slice(0, n) + '…';
  return s;
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  if (req.method === 'GET' && req.url.startsWith('/health')) {
    return send(res, 200, { status: 'ok', ts: Date.now() });
  }

  if (req.method === 'POST' && req.url.startsWith('/log')) {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 5e6) req.destroy(); }); // ~5MB limit
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const items = toArray(data);
        if (!items.length) return send(res, 200, { ok: true, n: 0 });

        const lines = [];
        const now = new Date().toISOString();
        items.forEach((item) => {
          try {
            const line = Object.assign({ receivedAt: now, clientIP: req.socket.remoteAddress }, item);
            lines.push(JSON.stringify(line));

            // Print concise line to stdout
            const t = item.type || 'log';
            const a0 = (item.args && item.args[0]) != null ? short(item.args[0]) : '';
            console.log(`[${t}] ${a0}`);
          } catch (e) {
            // skip
          }
        });

        fs.appendFile(LOG_PATH, lines.join('\n') + '\n', { encoding: 'utf8' }, (err) => {
          if (err) console.error('appendFile error:', err.message);
        });

        return send(res, 200, { ok: true, n: items.length });
      } catch (e) {
        return send(res, 400, { ok: false, error: 'Invalid JSON' });
      }
    });
    return;
  }

  // Default 404
  send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mobile Log Server running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   HTTP:    POST http://localhost:${PORT}/log`);
});

