#!/usr/bin/env python3
# Lightweight Mobile Log Server (Python, no external deps)
# Usage: python3 scripts/mobile_log_server.py [port]

import json, sys, time, os
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3001
LOG_PATH = os.path.join(os.getcwd(), 'mobile-logs.jsonl')

class Handler(BaseHTTPRequestHandler):
    def _set_headers(self, code=200, extra=None):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        if extra:
            for k, v in extra.items():
                self.send_header(k, v)
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)
        self.wfile.write(b'{"ok":true}')

    def do_GET(self):
        if self.path.startswith('/health'):
            self._set_headers(200)
            self.wfile.write(json.dumps({"status":"ok","ts":int(time.time()*1000)}).encode('utf-8'))
            return
        self._set_headers(404)
        self.wfile.write(json.dumps({"ok":False,"error":"Not found"}).encode('utf-8'))

    def do_POST(self):
        if not self.path.startswith('/log'):
            self._set_headers(404)
            self.wfile.write(json.dumps({"ok":False,"error":"Not found"}).encode('utf-8'))
            return
        length = int(self.headers.get('Content-Length', '0'))
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode('utf-8') or '[]')
        except Exception:
            self._set_headers(400)
            self.wfile.write(json.dumps({"ok":False,"error":"Invalid JSON"}).encode('utf-8'))
            return
        if not isinstance(data, list):
            data = [data]
        now_iso = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        lines = []
        for item in data:
            if not isinstance(item, dict):
                continue
            item = dict(item)
            item['receivedAt'] = now_iso
            item['clientIP'] = self.client_address[0]
            lines.append(json.dumps(item, ensure_ascii=False))
            # concise stdout
            t = item.get('type','log')
            args = item.get('args') or []
            a0 = str(args[0])[:160] if args else ''
            print(f"[{t}] {a0}")
        try:
            with open(LOG_PATH, 'a', encoding='utf-8') as f:
                f.write("\n".join(lines) + "\n")
        except Exception as e:
            print('append error:', e)
        self._set_headers(200)
        self.wfile.write(json.dumps({"ok":True,"n":len(lines)}).encode('utf-8'))

if __name__ == '__main__':
    httpd = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f"🚀 Mobile Log Server (Python) running on port {PORT}")
    print(f"   Health:  http://localhost:{PORT}/health")
    print(f"   HTTP:    POST   http://localhost:{PORT}/log")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

