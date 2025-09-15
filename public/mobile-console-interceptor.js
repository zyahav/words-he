/*
  Mobile Console Interceptor
  - Streams console logs, errors, touch events, device info to a debug server.
  - Activation: only when debug mode is enabled (URL ?debug=on or localStorage['hebrewTrainerDebug']==='on').
  - Endpoints (configurable via URL params):
      ?debugWs=wss://your-host:3001
      ?debugHttp=https://your-host:3001/log
    Defaults: ws://localhost:3001 and http://localhost:3001/log
*/
(function () {
  try {
    var url = new URL(window.location.href);
    var debugParam = url.searchParams.get('debug');
    var ls = null;
    try { ls = localStorage.getItem('hebrewTrainerDebug'); } catch (e) {}
    var debugEnabled = (debugParam === 'on') || (ls === 'on');
    if (!debugEnabled) return; // Do nothing if not in debug mode

    var wsParam = url.searchParams.get('debugWs');
    var httpParam = url.searchParams.get('debugHttp');
    var WEBSOCKET_URL = wsParam || (window.MOBILE_DEBUG_WS || 'ws://localhost:3001');
    var FALLBACK_URL = httpParam || (window.MOBILE_DEBUG_HTTP || 'http://localhost:3001/log');

    var orig = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    function nowISO() { return new Date().toISOString(); }
    function viewport() {
      return { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio || 1 };
    }

    var queue = [];
    var ws = null;
    var wsReady = false;
    var wsTried = false;
    var httpBatchTimer = null;

    function buildPayload(type, argsObj) {
      return {
        type: type,
        args: Array.prototype.slice.call(argsObj),
        timestamp: Date.now(),
        device: navigator.userAgent,
        url: window.location.href,
        viewport: viewport()
      };
    }

    function enqueue(payload) {
      try { queue.push(payload); } catch (_) {}
      flush();
    }

    function flush() {
      try {
        if (wsReady && ws && ws.readyState === 1) {
          while (queue.length) {
            ws.send(JSON.stringify(queue.shift()));
          }
          return;
        }
        // HTTP fallback batching
        if (!httpBatchTimer) {
          httpBatchTimer = setTimeout(function () {
            var batch = queue.splice(0, queue.length);
            httpBatchTimer = null;
            if (!batch.length) return;
            try {
              fetch(FALLBACK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batch)
              }).catch(function () { /* ignore */ });
            } catch (_) {}
          }, 400);
        }
      } catch (_) {}
    }

    function tryConnectWs() {
      if (wsTried) return;
      wsTried = true;
      try {
        ws = new WebSocket(WEBSOCKET_URL.replace(/^http/, 'ws').replace(/^https/, 'wss'));
        ws.onopen = function () {
          wsReady = true;
          enqueue({ type: 'info', args: ['🟢 Connected to debug server', nowISO()], timestamp: Date.now(), device: navigator.userAgent, url: window.location.href, viewport: viewport() });
          flush();
        };
        ws.onclose = function () { wsReady = false; };
        ws.onerror = function () { wsReady = false; };
        ws.onmessage = function () { /* ignored */ };
      } catch (_) {
        wsReady = false;
      }
    }

    // Patch console
    console.log = function () { try { enqueue(buildPayload('log', arguments)); } catch (_) {} orig.log.apply(console, arguments); };
    console.warn = function () { try { enqueue(buildPayload('warn', arguments)); } catch (_) {} orig.warn.apply(console, arguments); };
    console.error = function () { try { enqueue(buildPayload('error', arguments)); } catch (_) {} orig.error.apply(console, arguments); };
    console.info = function () { try { enqueue(buildPayload('info', arguments)); } catch (_) {} orig.info.apply(console, arguments); };

    // Global error handlers
    window.addEventListener('error', function (e) {
      try { enqueue({ type: 'error', args: [String(e.error || e.message || 'Unknown error')], timestamp: Date.now(), device: navigator.userAgent, url: window.location.href, viewport: viewport() }); } catch (_) {}
    });
    window.addEventListener('unhandledrejection', function (e) {
      try { enqueue({ type: 'error', args: ['UnhandledRejection', String(e.reason)], timestamp: Date.now(), device: navigator.userAgent, url: window.location.href, viewport: viewport() }); } catch (_) {}
    });

    // Touch events (throttled)
    var lastTouchAt = 0;
    window.addEventListener('touchstart', function (e) {
      var t = Date.now();
      if (t - lastTouchAt < 300) return; // throttle
      lastTouchAt = t;
      var touch = (e.touches && e.touches[0]) || {};
      var targetTag = (e.target && e.target.tagName) || 'UNKNOWN';
      enqueue({ type: 'touch', args: [{ touches: e.touches ? e.touches.length : 0, clientX: touch.clientX, clientY: touch.clientY, target: targetTag }], timestamp: t, device: navigator.userAgent, url: window.location.href, viewport: viewport() });
    }, { passive: true });

    // Initial device info
    enqueue({ type: 'info', args: ['📱 Device', navigator.userAgent], timestamp: Date.now(), device: navigator.userAgent, url: window.location.href, viewport: viewport() });

    // Kick off WS connection (non-blocking)
    tryConnectWs();
  } catch (e) {
    try { console.warn('mobile-console-interceptor init failed:', e); } catch (_) {}
  }
})();

