// Console timestamp patch with debug-aware gating
// - In non-debug mode: suppress console.log/info/debug (keep warn/error)
// - In debug mode (via ?debug=on or localStorage 'hebrewTrainerDebug' = 'on'): show all
(function () {
	const orig = {
		log: console.log.bind(console),
		info: console.info.bind(console),
		warn: console.warn.bind(console),
		error: console.error.bind(console),
		debug: console.debug
			? console.debug.bind(console)
			: console.log.bind(console),
	};
	function ts() {
		try {
			return new Date().toISOString();
		} catch (_) {
			return '';
		}
	}
	function isDebugEnabled() {
		try {
			const url = new URL(window.location.href);
			const v = url.searchParams.get('debug');
			if (v === 'on') return true;
			if (v === 'off') return false;
			const stored = localStorage.getItem('hebrewTrainerDebug');
			if (stored === 'on') return true;
			if (stored === 'off') return false;
		} catch (_) {
			/* ignore */
		}
		return false;
	}
	// Expose helper in case app code wants to check it
	window.__isDebugEnabled = isDebugEnabled;

	['log', 'info', 'warn', 'error', 'debug'].forEach((kind) => {
		const fn = orig[kind];
		console[kind] = function (...args) {
			// Always print warn/error; gate log/info/debug by debug flag
			const allowed = kind === 'warn' || kind === 'error' || isDebugEnabled();
			if (!allowed) return;
			fn(`[${ts()}]`, ...args);
		};
	});
})();
