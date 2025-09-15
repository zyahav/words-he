// Game Logic Module
let currentWordIndex = 0;
let currentStage = 'start'; // start, hebrew, translation, complete
let startTime = null;
let appInitialized = false; // one-time setup flag

// Style selection (image theme)
let selectedStyle = '';
function getStyleFromUrl() {
	const p = new URLSearchParams(window.location.search);
	return p.get('style') || '';
}
function getStoredStyle() {
	return localStorage.getItem('hebrewTrainerStyle') || '';
}
function storeStyle(v) {
	if (v) localStorage.setItem('hebrewTrainerStyle', v);
	else localStorage.removeItem('hebrewTrainerStyle');
}
function applyStyleSelectionUI() {
	try {
		// Update legacy select if present
		if (typeof styleSelectEl !== 'undefined' && styleSelectEl) {
			styleSelectEl.value = selectedStyle || '';
		}
		// Update style buttons grid
		const buttons = document.querySelectorAll('.style-button');
		buttons.forEach((btn) => {
			const val = btn.getAttribute('data-style') || '';
			btn.classList.toggle('active', !!selectedStyle && val === selectedStyle);
		});
	} catch (_) {}
}
function initStyleSelection() {
	const fromUrl = getStyleFromUrl();
	selectedStyle = fromUrl ? fromUrl : getStoredStyle();
	applyStyleSelectionUI();
	try {
		// Legacy select support
		if (typeof styleSelectEl !== 'undefined' && styleSelectEl) {
			styleSelectEl.addEventListener('change', () => {
				selectedStyle = styleSelectEl.value || '';
				storeStyle(selectedStyle);
				applyStyleSelectionUI();
			});
		}
		// Grid buttons
		const buttons = document.querySelectorAll('.style-button');
		buttons.forEach((btn) => {
			btn.addEventListener('click', () => {
				const val = btn.getAttribute('data-style') || '';
				selectedStyle = val;
				storeStyle(selectedStyle);
				applyStyleSelectionUI();
				// Auto-start training on style click when on Start screen
				if (typeof currentStage === 'undefined' || currentStage === 'start') {
					startApp();
				}
			});
		});
	} catch (_) {}
}

function resetWordImage() {
	try {
		if (typeof wordImageEl !== 'undefined' && wordImageEl) {
			wordImageEl.style.visibility = 'hidden';
			wordImageEl.removeAttribute('src');
			wordImageEl.alt = '';
		}
	} catch (_) {}
}

function buildImageCandidatesForWord(word) {
	if (!selectedStyle) return [];
	const candidates = [];
	const dir = `images/cards/${selectedStyle}/`;
	// 1) Try the exact filename if provided (preserves niqqud and extension)
	if (word.image && typeof word.image === 'string') {
		candidates.push(dir + encodeURIComponent(word.image));
	}
	// 2) Try normalized base names with common extensions (prefer jpg/jpeg/png, then webp)
	const stripNiqqud = (s) => s.replace(/[\u05B0-\u05C7\u05C8-\u05CF]/g, '');
	const normalize = (s) =>
		stripNiqqud((s || '').replace(/\.[a-zA-Z0-9]+$/, '')).trim();
	const bases = Array.from(
		new Set(
			[normalize(word.image || ''), normalize(word.he || '')].filter(Boolean)
		)
	);
	for (const b of bases) {
		const enc = encodeURIComponent(b);
		candidates.push(
			`${dir}${enc}.jpg`,
			`${dir}${enc}.jpeg`,
			`${dir}${enc}.png`,
			`${dir}${enc}.webp`
		);
	}
	return candidates;
}

function showCurrentWordImageThen(next) {
	if (!selectedStyle) {
		next();
		return;
	}
	const word = words[currentWordIndex];
	const candidates = buildImageCandidatesForWord(word);
	if (!candidates.length) {
		next();
		return;
	}
	let idx = 0;
	const tryNext = () => {
		if (idx >= candidates.length) {
			next();
			return;
		}
		const src = candidates[idx++];
		const img = new Image();
		img.onload = () => {
			try {
				if (wordImageEl) {
					wordImageEl.src = src;
					wordImageEl.alt = word.he || '';
					wordImageEl.style.visibility = 'visible';
				}
			} catch (_) {}
			setTimeout(() => {
				resetWordImage();
				next();
			}, 1000);
		};
		img.onerror = () => {
			tryNext();
		};
		img.src = src;
	};
	tryNext();
}

// Mode: Hebrew-only (skip English step) via URL params
// Enable with either ?hebrewOnly=on or ?mode=hebrew
let hebrewOnlyMode = false;
function initHebrewOnlyMode() {
	const p = new URLSearchParams(window.location.search);
	hebrewOnlyMode = p.get('hebrewOnly') === 'on' || p.get('mode') === 'hebrew';
	console.log(`🛠️ [MODE] Hebrew-only mode: ${hebrewOnlyMode ? 'ON' : 'OFF'}`);
}

// High score tracking
function getHighScore() {
	const saved = localStorage.getItem('hebrewTrainerHighScore');
	return saved ? parseInt(saved, 10) : null;
}

function setHighScore(timeInSeconds) {
	localStorage.setItem('hebrewTrainerHighScore', timeInSeconds.toString());
}
// Begin a new training run: used by both Start and Restart
function beginRun() {
	console.log('🎬 [BEGIN_RUN] Initializing new run');

	// Hide start UI
	const startBtn = document.querySelector('.start-button');
	const titleEl = document.querySelector('h1');
	if (startBtn) startBtn.style.display = 'none';
	if (titleEl) titleEl.style.display = 'none';
	try {
		if (typeof stylesGridEl !== 'undefined' && stylesGridEl)
			stylesGridEl.style.display = 'none';
	} catch (_) {}
	// Show gameplay UI elements
	try {
		const wordImageBoxEl = document.getElementById('wordImageBox');
		if (wordImageBoxEl) wordImageBoxEl.style.display = 'flex';
		hebrewTextEl.style.display = 'block';
		statusEl.style.display = 'block';
		soundVisualizerEl.style.display = 'block';
		const speakerRowEl = document.querySelector('.speaker-row');
		if (speakerRowEl) speakerRowEl.style.display = 'flex';
	} catch (_) {}

	// Reset per-run UI
	hebrewTextEl.innerHTML = '';
	hebrewTextEl.textContent = '';
	hebrewTextEl.classList.remove('question-mark');
	hebrewTextEl.style.direction = 'rtl';
	hebrewTextEl.style.fontFamily = '';
	hebrewTextEl.style.fontSize = '';
	hebrewTextEl.style.color = '';

	speakerButtonEl.style.visibility = 'hidden';
	updateStatus('');
	if (starsEl) {
		starsEl.classList.add('hidden');
		starsEl.style.display = 'none';
	}
	if (completionTimeEl) {
		completionTimeEl.classList.add('hidden');
		completionTimeEl.style.display = 'none';
	}
	if (restartButtonEl) {
		restartButtonEl.classList.add('hidden');
		restartButtonEl.style.display = 'none';
	}
	// Keep styles grid hidden during gameplay
	// (it will be shown again on Exit to Start)
	hideError();

	// Reset stars animation
	const stars = starsEl ? starsEl.querySelectorAll('.star') : [];
	stars.forEach((star) => star.classList.remove('animate'));

	// Ensure clean audio/recognition state
	stopListening();
	// Keep visualizer visible during gameplay
	showSoundVisualizer();
	hideRecognitionFeedback();
	resetWordImage();

	// If debug is enabled, keep the recognition box and test button visible immediately
	try {
		const fromUrl = getDebugModeFromUrl();
		const stored = getStoredDebugMode();
		const enabled =
			fromUrl !== null ? fromUrl : stored !== null ? stored : false;
		applyDebugModeUI(enabled);
	} catch (e) {
		console.log('⚠️ [BEGIN_RUN] Could not re-apply debug UI:', e);
	}

	// Reset run state
	currentWordIndex = 0;
	startTime = Date.now();
	currentStage = 'start';

	console.log('🎯 [BEGIN_RUN] Starting with first Hebrew word');
	if (exitButtonEl) {
		exitButtonEl.classList.remove('hidden');
		exitButtonEl.style.display = 'inline-flex';
	}
	showHebrewWord();
}

// Exit to Start screen (shows Start button and title, stops recognition)
function exitToStart() {
	console.log('⬅️ [EXIT] Exit to Start requested');
	// Stop mic and visuals
	stopListening();
	hideSoundVisualizer();
	hideRecognitionFeedback();
	resetWordImage();

	// Reset stage
	currentStage = 'start';

	// Hide gameplay UI elements on Start screen
	try {
		const wordImageBoxEl = document.getElementById('wordImageBox');
		if (wordImageBoxEl) wordImageBoxEl.style.display = 'none';
		hebrewTextEl.style.display = 'none';
		statusEl.style.display = 'none';
		soundVisualizerEl.style.display = 'none';
		const speakerRowEl = document.querySelector('.speaker-row');
		if (speakerRowEl) speakerRowEl.style.display = 'none';
	} catch (_) {}

	// Reset UI elements
	hebrewTextEl.textContent = '';
	speakerButtonEl.style.display = 'none';
	updateStatus('Click "Start Training" to begin');

	if (starsEl) {
		starsEl.classList.add('hidden');
		starsEl.style.display = 'none';
	}
	if (completionTimeEl) {
		completionTimeEl.classList.add('hidden');
		completionTimeEl.style.display = 'none';
	}
	if (restartButtonEl) {
		restartButtonEl.classList.add('hidden');
		restartButtonEl.style.display = 'none';
	}
	if (exitButtonEl) {
		exitButtonEl.classList.add('hidden');
		exitButtonEl.style.display = 'none';
	}

	// Show start UI
	const startBtn = document.querySelector('.start-button');
	const titleEl = document.querySelector('h1');
	if (titleEl) titleEl.style.display = 'block';
	if (startBtn) startBtn.style.display = 'inline-block';
	try {
		if (typeof stylesGridEl !== 'undefined' && stylesGridEl)
			stylesGridEl.style.display = 'grid';
	} catch (_) {}
}

// Stage handlers
function showHebrewWord() {
	console.log('🔄 [SHOW_HEBREW] Function called');
	console.log(`   Word index: ${currentWordIndex}`);
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	// FIRST: Stop any existing recognition to ensure clean transition
	console.log('🛑 [SHOW_HEBREW] Stopping existing recognition');
	stopListening();

	// THEN: Set stage to Hebrew
	currentStage = 'hebrew';
	resultAccepted = false; // reset fast-pass guard for this stage
	const currentWord = words[currentWordIndex];

	console.log(
		`🔄 [SHOW_HEBREW] Switching to Hebrew word #${currentWordIndex + 1}: "${
			currentWord.he
		}"`
	);
	console.log(`   Hebrew alternatives: ${currentWord.he_alternatives}`);

	// Completely reset Hebrew text element
	console.log('🎨 [SHOW_HEBREW] Resetting text element');
	hebrewTextEl.innerHTML = '';
	hebrewTextEl.textContent = '';
	hebrewTextEl.classList.remove('question-mark');
	resetWordImage();

	// Force reset all inline styles that might interfere
	hebrewTextEl.style.direction = 'rtl';
	hebrewTextEl.style.fontFamily = '';
	hebrewTextEl.style.fontSize = '';
	hebrewTextEl.style.color = '';

	// Now set the Hebrew text
	hebrewTextEl.textContent = currentWord.he;
	console.log(`✅ [SHOW_HEBREW] Hebrew text set: "${currentWord.he}"`);

	// Hide speaker button during Hebrew stage
	speakerButtonEl.style.visibility = 'hidden';

	// No instructional text during Hebrew stage; status will show Listening... when recognition starts
	updateStatus('');

	// Start listening with Hebrew language (short delay for clean transition)
	console.log(
		'⏰ [SHOW_HEBREW] Setting 150ms timeout before starting Hebrew recognition'
	);
	setTimeout(() => {
		console.log(
			'⏰ [SHOW_HEBREW] Timeout triggered - starting Hebrew recognition'
		);
		startListening();
	}, 150);
}

function handleCorrectHebrew() {
	console.log('✅ [HANDLE_CORRECT_HEBREW] Function called');
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	stopListening();
	triggerConfetti();
	playSound(1000, 300);

	const proceed = () => {
		if (hebrewOnlyMode) {
			console.log(
				'🔄 [HANDLE_CORRECT_HEBREW] Hebrew-only mode: moving to next word'
			);
			nextWord();
		} else {
			console.log(
				'🔄 [HANDLE_CORRECT_HEBREW] Moving to English translation stage'
			);
			showQuestionMark();
		}
	};
	showCurrentWordImageThen(proceed);
}

function showQuestionMark() {
	console.log('🔄 [SHOW_QUESTION_MARK] Function called');
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	// FIRST: Stop any existing recognition to ensure clean transition
	console.log('🛑 [SHOW_QUESTION_MARK] Stopping existing recognition');
	stopListening();

	// THEN: Set stage to English translation
	currentStage = 'translation';
	resultAccepted = false; // reset fast-pass guard for this stage
	const currentWord = words[currentWordIndex];

	console.log(
		'🔄 [SHOW_QUESTION_MARK] Entering English meaning stage (word hidden)'
	);
	console.log(`   English alternatives: ${currentWord.en_alternatives}`);

	// Keep displaying the Hebrew word; do not reveal English
	console.log('🎨 [SHOW_QUESTION_MARK] Ensuring Hebrew word remains visible');
	hebrewTextEl.classList.remove('question-mark');
	hebrewTextEl.style.direction = 'rtl';
	hebrewTextEl.style.fontFamily = '';
	hebrewTextEl.style.fontSize = '';
	hebrewTextEl.style.color = '';
	hebrewTextEl.textContent = currentWord.he;
	console.log(
		`✅ [SHOW_QUESTION_MARK] Hebrew remains visible: "${currentWord.he}"`
	);

	// Show speaker button for pronunciation (plays the hidden English meaning)
	speakerButtonEl.style.visibility = 'visible';

	updateStatus(
		'Say the English meaning out loud<br><small>Click 🔊 to hear the pronunciation if needed</small>'
	);

	// Start listening with English language (short delay for clean transition)
	console.log(
		'⏰ [SHOW_QUESTION_MARK] Setting 150ms timeout before starting English recognition'
	);
	setTimeout(() => {
		console.log(
			'⏰ [SHOW_QUESTION_MARK] Timeout triggered - starting English recognition'
		);
		startListening();
	}, 150);
}

function handleCorrectTranslation() {
	console.log('✅ [HANDLE_CORRECT_TRANSLATION] Function called');
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	stopListening();
	speakerButtonEl.style.visibility = 'hidden'; // Hide speaker button

	triggerConfetti();
	playSound(1200, 300);

	setTimeout(() => {
		console.log('🔄 [HANDLE_CORRECT_TRANSLATION] Moving to next word');
		nextWord();
	}, 100);
}

function nextWord() {
	console.log('➡️ [NEXT_WORD] Function called');
	console.log(`   Current word index: ${currentWordIndex}`);
	console.log(`   Total words: ${words.length}`);
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	currentWordIndex++;

	if (currentWordIndex >= words.length) {
		console.log('🎉 [NEXT_WORD] All words completed - showing completion');
		showCompletion();
	} else {
		console.log(`🔄 [NEXT_WORD] Moving to word #${currentWordIndex + 1}`);
		showHebrewWord();
	}
}

function showCompletion() {
	console.log('🎉 [SHOW_COMPLETION] Function called');
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	currentStage = 'complete';
	stopListening();

	// Hide gameplay UI elements on completion
	try {
		const wordImageBoxEl = document.getElementById('wordImageBox');
		if (wordImageBoxEl) wordImageBoxEl.style.display = 'none';
		hebrewTextEl.style.display = 'none';
		statusEl.style.display = 'none';
		soundVisualizerEl.style.display = 'none';
		const speakerRowEl = document.querySelector('.speaker-row');
		if (speakerRowEl) speakerRowEl.style.display = 'none';
		hideRecognitionFeedback();
	} catch (_) {}

	const endTime = Date.now();
	const totalTime = Math.round((endTime - startTime) / 1000);
	const minutes = Math.floor(totalTime / 60);
	const seconds = totalTime % 60;
	const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

	console.log(`✅ [SHOW_COMPLETION] Training completed in ${timeString}`);

	// Check for high score
	const previousHighScore = getHighScore();
	const isNewHighScore =
		previousHighScore === null || totalTime < previousHighScore;

	if (isNewHighScore) {
		setHighScore(totalTime);
		console.log(`🏆 [SHOW_COMPLETION] New high score! ${timeString}`);
	}

	hebrewTextEl.textContent = '';

	if (isNewHighScore) {
		updateStatus(
			'🏆 NEW HIGH SCORE! 🏆<br>Congratulations! Training Complete!'
		);
	} else {
		updateStatus('Congratulations! Training Complete!');
	}

	// Show stars with animation
	starsEl.classList.remove('hidden');
	starsEl.style.display = 'flex';
	const stars = starsEl.querySelectorAll('.star');

	stars.forEach((star, index) => {
		setTimeout(() => {
			star.classList.add('animate');
			playSound(800 + index * 200, 300);
		}, index * 500);
	});

	// Show completion time and restart button
	setTimeout(() => {
		completionTimeEl.classList.remove('hidden');

		// Build completion message with high score info
		const highScoreMinutes = Math.floor((previousHighScore || totalTime) / 60);
		const highScoreSeconds = (previousHighScore || totalTime) % 60;
		const highScoreString =
			highScoreMinutes > 0
				? `${highScoreMinutes}m ${highScoreSeconds}s`
				: `${highScoreSeconds}s`;

		if (isNewHighScore) {
			completionTimeEl.innerHTML = `
				<div style="color: #ffd700; font-size: 1.4em; margin-bottom: 10px;">🏆 NEW HIGH SCORE! 🏆</div>
				<div>Your Time: ${timeString}</div>
				<div style="color: #4ecdc4;">Best Time: ${timeString}</div>
			`;
		} else {
			completionTimeEl.innerHTML = `
				<div>Your Time: ${timeString}</div>
				<div style="color: #4ecdc4;">Best Time: ${highScoreString}</div>
			`;
		}

		completionTimeEl.style.display = 'block';
		restartButtonEl.classList.remove('hidden');
		restartButtonEl.style.display = 'inline-block';

		// Enhanced confetti for new high score
		if (isNewHighScore) {
			// Extra special confetti celebration for high score
			triggerConfetti();
			setTimeout(() => triggerConfetti(), 200);
			setTimeout(() => triggerConfetti(), 400);
			setTimeout(() => triggerConfetti(), 600);
			setTimeout(() => triggerConfetti(), 800);
		} else {
			// Regular completion confetti
			triggerConfetti();
			setTimeout(() => triggerConfetti(), 300);
		}
	}, 1500);
}

// App control functions
async function startApp() {
	console.log('🚀 [START_APP] Function called');
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	hideError();

	// Request microphone permission and setup visualizer
	try {
		console.log('🎤 [START_APP] Setting up sound visualizer');
		await setupSoundVisualizer();
	} catch (e) {
		console.error('❌ [START_APP] Microphone setup failed:', e);
		showError(
			'Microphone access denied. Please enable microphone access and try again.'
		);
		return;
	}

	console.log('🔧 [START_APP] Setting up speech recognition');
	if (!setupSpeechRecognition()) {
		return;
	}

	// Hide start button and start training
	appInitialized = true;
	beginRun();
}

function restartApp() {
	console.log('🔄 [RESTART_APP] Function called');
	console.log(`   Timestamp: ${new Date().toISOString()}`);
	// Stop any ongoing listening and clear timers/visuals
	stopListening();
	// Reinitialize modes as on page load (like a soft reload)
	initHebrewOnlyMode();
	initDebugMode();
	if (!appInitialized) {
		startApp();
		return;
	}
	beginRun();
}

// Test function for debugging
function testHebrewRecognition() {
	console.log('🧪 [TEST] Test function called');
	console.log(`   Current stage: ${currentStage}`);
	console.log(`   Current word index: ${currentWordIndex}`);

	if (currentStage === 'hebrew') {
		const currentWord = words[currentWordIndex];
		console.log('🧪 [TEST] Testing Hebrew word:', currentWord.he);
		console.log(
			'🧪 [TEST] Available Hebrew alternatives:',
			currentWord.he_alternatives
		);

		const testWord =
			currentWord.he_alternatives[1] || currentWord.he_alternatives[0];
		console.log('🧪 [TEST] Testing with Hebrew alternative:', testWord);

		handleSpeechResult([testWord]);
	} else if (currentStage === 'translation') {
		const currentWord = words[currentWordIndex];
		console.log('🧪 [TEST] Testing English word:', currentWord.en);
		console.log(
			'🧪 [TEST] Available English alternatives:',
			currentWord.en_alternatives
		);

		const testWord = currentWord.en_alternatives[0];
		console.log('🧪 [TEST] Testing with English alternative:', testWord);

		handleSpeechResult([testWord]);
	}
}

// Debug mode helpers and keyboard toggle (persisted in localStorage)
const DEBUG_STORAGE_KEY = 'hebrewTrainerDebug';

function applyDebugModeUI(enabled) {
	const recognitionBox = document.getElementById('recognitionFeedback');
	const testButton = document.getElementById('testButton');
	if (recognitionBox) {
		recognitionBox.classList.toggle('hidden', !enabled);
		recognitionBox.style.display = enabled ? 'block' : 'none';
	}
	if (testButton) {
		testButton.classList.toggle('hidden', !enabled);
		testButton.style.display = enabled ? 'inline-block' : 'none';
	}
}

function getDebugModeFromUrl() {
	const p = new URLSearchParams(window.location.search);
	const v = p.get('debug');
	if (v === 'on') return true;
	if (v === 'off') return false;
	return null;
}

function getStoredDebugMode() {
	const v = localStorage.getItem(DEBUG_STORAGE_KEY);
	if (v === 'on') return true;
	if (v === 'off') return false;
	return null;
}

function storeDebugMode(enabled) {
	localStorage.setItem(DEBUG_STORAGE_KEY, enabled ? 'on' : 'off');
}

function setUrlDebugParam(enabled) {
	const url = new URL(window.location.href);
	const current = url.searchParams.get('debug');
	const desired = enabled ? 'on' : 'off';
	if (current !== desired) {
		url.searchParams.set('debug', desired);
		history.replaceState({}, '', url);
	}
}

function initDebugMode() {
	const fromUrl = getDebugModeFromUrl();
	let enabled;
	if (fromUrl !== null) {
		enabled = fromUrl;
		storeDebugMode(enabled);
	} else {
		const stored = getStoredDebugMode();
		enabled = stored !== null ? stored : false;
	}
	applyDebugModeUI(enabled);
	// Do NOT modify URL on load; avoid unnecessary history.replaceState
}

function toggleDebugMode() {
	const current = getStoredDebugMode();
	const enabled = current === null ? true : !current;
	storeDebugMode(enabled);
	applyDebugModeUI(enabled);
	setUrlDebugParam(enabled);
}

// Initialize and attach keyboard handler on load
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		initHebrewOnlyMode();
		initDebugMode();
		initStyleSelection();
		document.addEventListener('keydown', (e) => {
			if (e.key === 'd' || e.key === 'D') {
				toggleDebugMode();
			} else if (e.key === 'r' || e.key === 'R') {
				restartApp();
			}
		});
	});
} else {
	initHebrewOnlyMode();
	initDebugMode();
	document.addEventListener('keydown', (e) => {
		if (e.key === 'd' || e.key === 'D') {
			toggleDebugMode();
		} else if (e.key === 'r' || e.key === 'R') {
			restartApp();
		}
	});
}
