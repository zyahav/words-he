// Console timestamp patch - prefixes all console outputs with ISO timestamp
(function () {
  const orig = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug ? console.debug.bind(console) : console.log.bind(console)
  };
  function ts() {
    try { return new Date().toISOString(); } catch (_) { return '' }
  }
  ['log', 'info', 'warn', 'error', 'debug'].forEach(kind => {
    const fn = orig[kind];
    console[kind] = function (...args) {
      fn(`[${ts()}]`, ...args);
    };
  });
})();
