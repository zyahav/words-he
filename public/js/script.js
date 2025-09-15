// Main Script - DOM handling and initialization

// DOM elements
const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');
const hebrewTextEl = document.getElementById('hebrewText');
const starsEl = document.getElementById('starsContainer');
const completionTimeEl = document.getElementById('completionTime');
const restartButtonEl = document.getElementById('restartButton');
const soundVisualizerEl = document.getElementById('soundVisualizer');
const visualizerCanvas = document.getElementById('visualizerCanvas');
const recognitionFeedbackEl = document.getElementById('recognitionFeedback');
const recognizedTextEl = document.getElementById('recognizedText');
const speakerButtonEl = document.getElementById('speakerButton');
const exitButtonEl = document.getElementById('exitButton');
const wordImageEl = document.getElementById('wordImage');
const styleSelectEl = document.getElementById('styleSelect');
const stylesGridEl = document.getElementById('stylesGrid');
const wordImageBoxEl = document.getElementById('wordImageBox');
const speakerRowEl = document.querySelector('.speaker-row');

// Utility functions
function showError(message) {
	errorEl.textContent = message;
	errorEl.style.display = 'block';
}

function hideError() {
	errorEl.style.display = 'none';
}

function updateStatus(message) {
	statusEl.innerHTML = message;
}

function showRecognitionFeedback() {
	recognitionFeedbackEl.style.display = 'block';
}

function hideRecognitionFeedback() {
	recognitionFeedbackEl.style.display = 'none';
}

function updateRecognitionFeedback(text, isFinal = false) {
	if (isFinal) {
		recognizedTextEl.innerHTML = `<span class="final-text">Final: "${text}"</span>`;
	} else {
		recognizedTextEl.innerHTML = `<span class="interim-text">Hearing: "${text}"</span>`;
	}
}

function normalizeText(text) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s]/g, '');
}

// Initialize app on page load
window.addEventListener('load', function () {
	console.log('🚀 [INIT] Page loaded, initializing app');
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	updateStatus('Click "Start Training" to begin');

	// On Start screen, hide gameplay UI elements
	try {
		if (wordImageBoxEl) wordImageBoxEl.style.display = 'none';
		hebrewTextEl.style.display = 'none';
		statusEl.style.display = 'none';
		soundVisualizerEl.style.display = 'none';
		if (speakerRowEl) speakerRowEl.style.display = 'none';
		hideRecognitionFeedback();
	} catch (_) {}

	// Clean up any inline styles and use CSS classes instead
	errorEl.classList.add('hidden');
	starsEl.classList.add('hidden');
	completionTimeEl.classList.add('hidden');
	restartButtonEl.classList.add('hidden');
	if (exitButtonEl) exitButtonEl.classList.add('hidden');

	console.log('✅ [INIT] App initialization complete');
});
