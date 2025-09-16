#!/usr/bin/env bash
set -euo pipefail

# Bootstrap a standalone Mobile Debug System repository
# - Creates a new repo with:
#   * client/mobile-console-interceptor.min.js (browser client)
#   * server/mobile_log_server.py (HTTP collector, no deps)
#   * .gitignore
#   * README.md (Quick Start + Tunnel setup)
# - Initializes git, makes initial commit
#
# Usage:
#   bash scripts/bootstrap-mobile-debug-system.sh [TARGET_DIR]
# Defaults:
#   TARGET_DIR="$HOME/Documents/dev/mobile-debug-system"

TARGET_DIR=${1:-"$HOME/Documents/dev/mobile-debug-system"}

mkdir -p "$TARGET_DIR"/client "$TARGET_DIR"/server

# -----------------------------
# .gitignore
# -----------------------------
cat > "$TARGET_DIR/.gitignore" <<'EOF'
# Local env and logs
.env
mobile-logs.jsonl

# OS/Editor
.DS_Store
.idea/
.vscode/

# Node (if used)
node_modules/
EOF

# -----------------------------
# client/mobile-console-interceptor.min.js (minified, debug-mode gated)
# -----------------------------
cat > "$TARGET_DIR/client/mobile-console-interceptor.min.js" <<'EOF'
(function(){try{var u=new URL(location.href),d=u.searchParams.get('debug'),ls=null;try{ls=localStorage.getItem('hebrewTrainerDebug')}catch(e){}var on=d==='on'||ls==='on';if(!on)return;var WS=u.searchParams.get('debugWs')||(window.MOBILE_DEBUG_WS||'ws://localhost:3001'),HT=u.searchParams.get('debugHttp')||(window.MOBILE_DEBUG_HTTP||'http://localhost:3001/log');var O={log:console.log,warn:console.warn,error:console.error,info:console.info};function V(){return{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1}}function B(t,a){return{type:t,args:[].slice.call(a),timestamp:Date.now(),device:navigator.userAgent,url:location.href,viewport:V()}}var Q=[],w=null,OK=!1,T=!1,hT=null;function E(p){try{Q.push(p)}catch(e){}F()}function F(){try{if(OK&&w&&w.readyState===1){while(Q.length)w.send(JSON.stringify(Q.shift()));return}if(!hT){hT=setTimeout(function(){var b=Q.splice(0,Q.length);hT=null;if(!b.length)return;try{fetch(HT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).catch(function(){})}catch(e){}},400)}}catch(e){}}function C(){if(T)return;T=!0;try{w=new WebSocket(WS.replace(/^http/,'ws').replace(/^https/,'wss'));w.onopen=function(){OK=!0;E({type:'info',args:['\uD83D\uDFE2 Connected',new Date().toISOString()],timestamp:Date.now(),device:navigator.userAgent,url:location.href,viewport:V()});F()};w.onclose=function(){OK=!1};w.onerror=function(){OK=!1};w.onmessage=function(){}}catch(e){OK=!1}}console.log=function(){try{E(B('log',arguments))}catch(e){}O.log.apply(console,arguments)};console.warn=function(){try{E(B('warn',arguments))}catch(e){}O.warn.apply(console,arguments)};console.error=function(){try{E(B('error',arguments))}catch(e){}O.error.apply(console,arguments)};console.info=function(){try{E(B('info',arguments))}catch(e){}O.info.apply(console,arguments)};addEventListener('error',function(e){try{E({type:'error',args:[String(e.error||e.message||'Unknown error')],timestamp:Date.now(),device:navigator.userAgent,url:location.href,viewport:V()})}catch(_){}});addEventListener('unhandledrejection',function(e){try{E({type:'error',args:['UnhandledRejection',String(e.reason)],timestamp:Date.now(),device:navigator.userAgent,url:location.href,viewport:V()})}catch(_){}});var lt=0;addEventListener('touchstart',function(e){var t=Date.now();if(t-lt<300)return;lt=t;var c=(e.touches&&e.touches[0])||{},tg=(e.target&&e.target.tagName)||'UNKNOWN';E({type:'touch',args:[{touches:e.touches?e.touches.length:0,clientX:c.clientX,clientY:c.clientY,target:tg}],timestamp:t,device:navigator.userAgent,url:location.href,viewport:V()})},{passive:true});E({type:'info',args:['\uD83D\uDCF1 Device',navigator.userAgent],timestamp:Date.now(),device:navigator.userAgent,url:location.href,viewport:V()});C()}catch(e){try{console.warn('mobile-console-interceptor init failed:',e)}catch(_){}}})();
EOF

# -----------------------------
# server/mobile_log_server.py (HTTP collector)
# -----------------------------
cat > "$TARGET_DIR/server/mobile_log_server.py" <<'EOF'
#!/usr/bin/env python3
# Lightweight Mobile Log Server (Python, no external deps)
# Usage: python3 server/mobile_log_server.py [port]

import json, sys, time, os
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3001
LOG_PATH = os.path.join(os.getcwd(), 'mobile-logs.jsonl')

class Handler(BaseHTTPRequestHandler):
    def _set(self, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set(200)
        self.wfile.write(b'{"ok":true}')

    def do_GET(self):
        if self.path.startswith('/health'):
            self._set(200)
            self.wfile.write(json.dumps({"status":"ok","ts":int(time.time()*1000)}).encode('utf-8'))
            return
        self._set(404)
        self.wfile.write(json.dumps({"ok":False,"error":"Not found"}).encode('utf-8'))

    def do_POST(self):
        if not self.path.startswith('/log'):
            self._set(404)
            self.wfile.write(json.dumps({"ok":False,"error":"Not found"}).encode('utf-8'))
            return
        length = int(self.headers.get('Content-Length','0'))
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode('utf-8') or '[]')
        except Exception:
            self._set(400)
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
            t = item.get('type','log')
            args = item.get('args') or []
            a0 = str(args[0])[:160] if args else ''
            print(f"[{t}] {a0}")
        try:
            with open(LOG_PATH, 'a', encoding='utf-8') as f:
                f.write("\n".join(lines) + "\n")
        except Exception as e:
            print('append error:', e)
        self._set(200)
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
EOF
chmod +x "$TARGET_DIR/server/mobile_log_server.py"

# -----------------------------
# README.md (Quick Start + Tunnel setup)
# -----------------------------
cat > "$TARGET_DIR/README.md" <<'EOF'
# Mobile Debug System

A tiny, reusable system to stream mobile browser logs to your terminal in real time.

## What it includes
- Client (browser): client/mobile-console-interceptor.min.js
- Server (collector, no deps): server/mobile_log_server.py

## Quick Start (local Wi‑Fi)
1) Start the log server:
   ```bash
   python3 server/mobile_log_server.py 3001
   # Health: http://localhost:3001/health
   ```
2) In your web app, load the client only in debug mode (example):
   ```html
   <script>
     (function(){
       var debug=new URL(location).searchParams.get('debug');
       if(debug==='on'){
         var s=document.createElement('script');
         s.src='/client/mobile-console-interceptor.min.js';
         document.body.appendChild(s);
       }
     })();
   </script>
   ```
3) On your phone (same Wi‑Fi as the server):
   - Open your app with: `?debug=on&debugHttp=http://[MAC_IP]:3001/log`
   - Logs stream to the terminal running the server

## Optional: use a public WSS endpoint (for HTTPS pages)
If your app runs on HTTPS (e.g., Vercel), prefer WSS for sockets:
- Run the server locally (same as above)
- Expose it with Cloudflare Tunnel to `wss://mobile-logs.your-domain.com`
- Load the page with: `?debug=on&debugWs=wss://mobile-logs.your-domain.com`

## Cloudflare Tunnel (persistent service)
Recommended: a named tunnel so it auto‑starts on boot.
```bash
# One‑time auth
cloudflared tunnel login
# Create a tunnel
cloudflared tunnel create mobile-logs
# Route DNS
cloudflared tunnel route dns mobile-logs mobile-logs.your-domain.com
# Create ~/.cloudflared/config.yml with:
# tunnel: mobile-logs
# credentials-file: /Users/you/.cloudflared/<UUID>.json
# ingress:
#   - hostname: mobile-logs.your-domain.com
#     service: http://localhost:3001
#   - service: http_status:404
# Install as a service
cloudflared service install
```
Notes:
- Do NOT commit tokens or .env to any repo
- Keep this project independent of your apps; apps only include the client and set the URL params

## URL Parameters supported by the client
- `debug=on|off` — enable/disable debug mode
- `debugHttp=http://HOST:3001/log` — POST endpoint for logs
- `debugWs=wss://HOST:3001` — optional WebSocket endpoint

## Files
- client/mobile-console-interceptor.min.js — browser client (minified)
- server/mobile_log_server.py — local log collector (HTTP)
- .gitignore — ignores env and logs
EOF

# -----------------------------
# Initialize git repo
# -----------------------------
(
  cd "$TARGET_DIR"
  git init
  git add -A
  git commit -m "feat: initial mobile debug client and Python log server\ndocs: add README and .gitignore"
)

cat <<INFO

✅ Mobile Debug System repo created at:
  $TARGET_DIR

Next steps:
1) Create GitHub repo and push:
   cd "$TARGET_DIR"
   git remote add origin https://github.com/<your-account>/mobile-debug-system.git
   git branch -M main
   git push -u origin main

2) In your app repo, include the client only in debug mode and pass debugHttp or debugWs params.
   Example loader is in README.md.

3) (Optional) Set up Cloudflare Tunnel as documented in README.md to get a stable WSS URL.

INFO

