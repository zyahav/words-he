// Audio and Visual Effects Module
let audioContext = null;
let analyser = null;
let microphone = null;
let dataArray = null;
let animationId = null;

// Play English word pronunciation
function playEnglishWord() {
	if (currentStage === 'translation' && 'speechSynthesis' in window) {
		const currentWord = words[currentWordIndex];

		// Temporarily stop listening to avoid picking up computer voice
		const wasListening = isListening;
		stopListening();

		// Create and configure speech synthesis
		const utterance = new SpeechSynthesisUtterance(currentWord.en);
		utterance.lang = 'en-US';
		utterance.rate = 0.8;
		utterance.volume = 0.8;

		// Visual feedback
		speakerButtonEl.style.background = '#4ecdc4';
		speakerButtonEl.textContent = '🔊';

		utterance.onstart = () => {
			updateStatus(
				'🔊 Playing pronunciation<br><small>Microphone temporarily disabled</small>'
			);
		};

		utterance.onend = () => {
			// Restore speaker button
			speakerButtonEl.style.background = '#ff6b6b';
			speakerButtonEl.textContent = '🔊';

			// Restore listening after a short delay
			setTimeout(() => {
				if (currentStage === 'translation') {
					updateStatus(
						'Say the English meaning out loud<br><small>Click 🔊 to hear the pronunciation if needed</small>'
					);
					if (wasListening) {
						startListening();
					}
				}
			}, 500);
		};

		utterance.onerror = () => {
			speakerButtonEl.style.background = '#ff6b6b';
			updateStatus('Error playing audio. Say the English meaning out loud');
			if (wasListening) {
				startListening();
			}
		};

		// Play the word
		speechSynthesis.speak(utterance);
	}
}

function playSound(frequency = 800, duration = 200) {
	if (
		typeof AudioContext !== 'undefined' ||
		typeof webkitAudioContext !== 'undefined'
	) {
		const audioContext = new (window.AudioContext ||
			window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
		oscillator.type = 'sine';

		gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			audioContext.currentTime + duration / 1000
		);

		oscillator.start();
		oscillator.stop(audioContext.currentTime + duration / 1000);
	}
}

function triggerConfetti() {
	if (typeof confetti !== 'undefined') {
		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
		});
	}
}

// Sound Visualizer Functions
async function setupSoundVisualizer() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		analyser = audioContext.createAnalyser();
		microphone = audioContext.createMediaStreamSource(stream);

		analyser.fftSize = 256;
		const bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);

		microphone.connect(analyser);

		return true;
	} catch (error) {
		console.error('Error setting up sound visualizer:', error);
		return false;
	}
}

function showSoundVisualizer() {
	soundVisualizerEl.style.display = 'block';
	startVisualization();
}

function hideSoundVisualizer() {
	soundVisualizerEl.style.display = 'none';
	if (animationId) {
		cancelAnimationFrame(animationId);
		animationId = null;
	}
}

function startVisualization() {
	const canvas = visualizerCanvas;
	const canvasCtx = canvas.getContext('2d');

	// Set canvas size
	canvas.width = 300;
	canvas.height = 100;

	function draw() {
		if (!analyser || !dataArray) return;

		animationId = requestAnimationFrame(draw);

		analyser.getByteFrequencyData(dataArray);

		canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
		canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

		const barWidth = (canvas.width / dataArray.length) * 2.5;
		let barHeight;
		let x = 0;

		for (let i = 0; i < dataArray.length; i++) {
			barHeight = (dataArray[i] / 255) * canvas.height;

			const r = barHeight + 25 * (i / dataArray.length);
			const g = 250 * (i / dataArray.length);
			const b = 50;

			canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
			canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

			x += barWidth + 1;
		}
	}

	draw();
}
