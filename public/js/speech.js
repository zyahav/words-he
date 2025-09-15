// Speech Recognition Module
let recognition = null;
let isListening = false;
let allowAutoRestart = true;
let restartTimerId = null;
let startTimerId = null;
let resultAccepted = false; // Guards immediate transitions to prevent double-handling
let listeningStage = null; // Stage snapshot when recognition actually starts
let listeningLang = null; // Language snapshot when recognition actually starts
let lastInterimLogAt = 0; // throttle noisy interim logs

// Session-scoped diagnostics for debugging recognition quality
let sessionResultCount = 0;
let lastHeardTranscript = '';
let lastHeardConfidence = null;

// Speech Recognition Setup
function setupSpeechRecognition() {
	console.log('🔧 [SETUP] Setting up speech recognition...');

	if (
		!('webkitSpeechRecognition' in window) &&
		!('SpeechRecognition' in window)
	) {
		console.error(
			'❌ [SETUP] Speech recognition not supported in this browser'
		);
		showError(
			'Speech recognition not supported in this browser. Please use Chrome or Edge.'
		);
		return false;
	}

	const SpeechRecognition =
		window.SpeechRecognition || window.webkitSpeechRecognition;
	recognition = new SpeechRecognition();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.maxAlternatives = 1;

	console.log(
		'✅ [SETUP] Speech recognition object created with continuous=true, interimResults=true'
	);

	recognition.onstart = function () {
		console.log('🎤 [RECOGNITION] onstart - Recognition started');
		console.log(`   Current stage: ${currentStage}`);
		console.log(`   Recognition language: ${recognition.lang}`);
		console.log(`   Timestamp: ${new Date().toISOString()}`);

		// Snapshot the stage/lang this listening session belongs to
		listeningStage = currentStage;
		listeningLang = recognition.lang;

		isListening = true;
		// Reset per-session diagnostics
		sessionResultCount = 0;
		lastHeardTranscript = '';
		lastHeardConfidence = null;
		updateStatus(
			'<div class="listening"><span class="mic-indicator"></span>Listening...</div>'
		);
		showSoundVisualizer();
		showRecognitionFeedback();
		updateRecognitionFeedback('Listening for speech...');
	};

	recognition.onend = function () {
		console.log('🛑 [RECOGNITION] onend - Recognition ended');
		console.log(`   Current stage: ${currentStage}`);
		console.log(`   Was listening: ${isListening}`);
		console.log(`   Timestamp: ${new Date().toISOString()}`);

		isListening = false;
		// Diagnostics: if no accepted result this session, log what we heard vs expected
		try {
			if (
				(listeningStage === 'hebrew' || listeningStage === 'translation') &&
				!resultAccepted
			) {
				const curr = words[currentWordIndex] || {};
				const expected =
					listeningStage === 'hebrew'
						? curr.he_alternatives || []
						: curr.en_alternatives || [];
				console.warn('👂 [RECOGNITION] Session ended without accepted match');
				console.warn(
					'   Last heard:',
					lastHeardTranscript,
					'| confidence:',
					lastHeardConfidence
				);
				console.warn('   Expected alternatives:', expected);
			}
		} catch (_) {}

		if (
			allowAutoRestart &&
			(currentStage === 'hebrew' || currentStage === 'translation')
		) {
			console.log(
				'🔄 [RECOGNITION] Will restart recognition shortly for active stage'
			);
			if (restartTimerId) {
				clearTimeout(restartTimerId);
				restartTimerId = null;
				console.log('⏹️ [RECOGNITION] Cleared previous restart timer');
			}
			restartTimerId = setTimeout(() => {
				console.log(
					'⏰ [RECOGNITION] Timeout triggered - checking if should restart'
				);
				console.log(`   Current stage: ${currentStage}`);
				if (
					allowAutoRestart &&
					(currentStage === 'hebrew' || currentStage === 'translation')
				) {
					console.log('🔄 [RECOGNITION] Restarting recognition...');
					startListening();
				} else {
					console.log(
						'❌ [RECOGNITION] Not restarting - stage changed or auto-restart disabled'
					);
				}
			}, 150);
		} else {
			console.log(
				'❌ [RECOGNITION] Not restarting - not in active stage or auto-restart disabled'
			);
		}
	};

	recognition.onerror = function (event) {
		// Handle benign cases first to avoid scary logs
		if (event.error === 'no-speech') {
			console.log(
				'ℹ️ [RECOGNITION] No speech detected — keeping session alive'
			);
			try {
				const curr = words[currentWordIndex] || {};
				const expected =
					currentStage === 'hebrew'
						? curr.he_alternatives || []
						: curr.en_alternatives || [];
				console.warn('   Expected alternatives at this moment:', expected);
			} catch (_) {}
			return;
		}
		if (event.error === 'aborted') {
			console.log('⚠️ [RECOGNITION] Aborted (normal during stop/start)');
			return;
		}
		// Real errors
		console.error('❌ [RECOGNITION] onerror', event.error);
		console.error(`   Current stage: ${currentStage}`);
		console.error(`   Was listening: ${isListening}`);
		console.error(`   Timestamp: ${new Date().toISOString()}`);

		if (event.error === 'not-allowed') {
			console.error('❌ [RECOGNITION] Microphone access denied');
			showError(
				'Microphone access denied. Please enable microphone access and reload the page.'
			);
		} else {
			console.error(
				`❌ [RECOGNITION] Other error: ${event.error} - will restart in 1000ms`
			);
			if (restartTimerId) {
				clearTimeout(restartTimerId);
				restartTimerId = null;
			}
			restartTimerId = setTimeout(() => {
				console.log(
					'⏰ [RECOGNITION] Error recovery timeout - checking if should restart'
				);
				if (
					allowAutoRestart &&
					(currentStage === 'hebrew' || currentStage === 'translation')
				) {
					console.log('🔄 [RECOGNITION] Restarting after error...');
					startListening();
				} else {
					console.log(
						'❌ [RECOGNITION] Not restarting after error - auto-restart disabled or stage inactive'
					);
				}
			}, 1000);
		}
	};

	recognition.onresult = function (event) {
		console.log('📝 [RECOGNITION] onresult - Speech result received');
		console.log(`   Event results length: ${event.results.length}`);
		console.log(`   Current stage: ${currentStage}`);
		console.log(`   Timestamp: ${new Date().toISOString()}`);

		const results = Array.from(event.results);
		const lastResult = results[results.length - 1];

		console.log(`   Last result index: ${results.length - 1}`);
		console.log(`   Is final: ${lastResult.isFinal}`);
		// Log everything the API heard in this chunk (alternatives) immediately
		try {
			const alts = Array.from(lastResult).map((alt) => ({
				text: alt.transcript,
				confidence: typeof alt.confidence === 'number' ? alt.confidence : null,
			}));
			const primaryNow = (lastResult[0] && lastResult[0].transcript) || '';
			console.log('👂 [HEARD] Alternatives:', alts);
			console.log(
				'👂 [HEARD] Primary:',
				primaryNow,
				'| final:',
				lastResult.isFinal
			);
		} catch (_) {}

		const primaryTranscript = (lastResult[0] && lastResult[0].transcript) || '';
		// Track last-heard transcript for diagnostics
		sessionResultCount++;
		lastHeardTranscript = primaryTranscript;
		try {
			lastHeardConfidence = (lastResult[0] && lastResult[0].confidence) ?? null;
		} catch (_) {
			lastHeardConfidence = null;
		}
		// Ignore stale results that arrive after the stage has changed
		if (currentStage !== listeningStage) {
			console.log(
				'⏭️ [RECOGNITION] Stale result from previous stage — ignoring',
				{ listeningStage, currentStage, primaryTranscript }
			);
			return;
		}

		// If we're in English stage but got Hebrew letters (likely stale/incorrect), ignore
		if (currentStage === 'translation') {
			const hasHebrewChars = /[\u0590-\u05FF]/.test(primaryTranscript);
			if (hasHebrewChars) {
				console.log(
					'🚫 [RECOGNITION] Hebrew letters detected during English stage — ignoring'
				);
				return;
			}
		}

		if (!lastResult.isFinal) {
			const interimTranscript = primaryTranscript;
			if (interimTranscript.trim() === '') {
				console.log('⚠️ [RECOGNITION] Empty interim transcript — ignoring');
				return;
			}
			console.log(`📝 [RECOGNITION] Interim result: "${interimTranscript}"`);
			updateRecognitionFeedback(interimTranscript, false);
			// FAST-PASS: accept high-confidence interim matches immediately
			if (!resultAccepted) {
				const t = interimTranscript.toLowerCase();
				if (currentStage === 'hebrew') {
					const noVowels = (s) =>
						s.replace(/[\u05B0-\u05C7\u05C8-\u05CF]/g, '').toLowerCase();
					const curr = words[currentWordIndex];
					const match = curr.he_alternatives.some((h) => {
						return (
							t.includes(h.toLowerCase()) || noVowels(t).includes(noVowels(h))
						);
					});
					if (match) {
						resultAccepted = true;
						console.log(
							'⚡ [FAST_PASS] Interim Hebrew matched — accepting and advancing'
						);
						handleSpeechResult([interimTranscript]);
					}
				} else if (currentStage === 'translation') {
					const curr = words[currentWordIndex];
					const match = curr.en_alternatives.some((e) =>
						t.includes(e.toLowerCase())
					);
					if (match) {
						resultAccepted = true;
						console.log(
							'⚡ [FAST_PASS] Interim English matched — accepting and advancing'
						);
						handleSpeechResult([interimTranscript]);
					}
				}
			}
		} else {
			// If we're in English stage but got Hebrew letters (likely stale/incorrect), ignore
			if (currentStage === 'translation') {
				const hasHebrewChars = /[\u0590-\u05FF]/.test(primaryTranscript);
				if (hasHebrewChars) {
					console.log(
						'🚫 [RECOGNITION] Hebrew letters detected during English stage (final) — ignoring'
					);
					return;
				}
			}

			if (resultAccepted) {
				console.log(
					'⏭️ [RECOGNITION] Final result arrived after fast-pass — ignoring'
				);
				return;
			}
			const finalTranscript = primaryTranscript;
			if (finalTranscript.trim() === '') {
				console.log('⚠️ [RECOGNITION] Empty final transcript — ignoring');
				return;
			}
			console.log(`✅ [RECOGNITION] Final result: "${finalTranscript}"`);
			console.log(`   Confidence: ${lastResult[0].confidence}`);
			updateRecognitionFeedback(finalTranscript, true);

			const alternatives = Array.from(lastResult).map((alt) => alt.transcript);
			console.log(`🔄 [RECOGNITION] Processing alternatives:`, alternatives);
			handleSpeechResult(alternatives);
		}
	};

	return true;
}

function startListening(immediate = false) {
	console.log('🎯 [START_LISTENING] Function called');
	console.log(`   Recognition exists: ${!!recognition}`);
	console.log(`   Is listening: ${isListening}`);
	console.log(`   Current stage: ${currentStage}`);
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	if (recognition) {
		if (isListening) {
			console.log('🛑 [START_LISTENING] Already listening — stopping first');
			try {
				recognition.stop();
				console.log('✅ [START_LISTENING] Recognition stopped successfully');
			} catch (e) {
				console.log(
					'⚠️ [START_LISTENING] Error stopping recognition (ignored):',
					e
				);
			}
		} else {
			console.log('✅ [START_LISTENING] Clean state (not listening)');
		}

		if (currentStage === 'hebrew') {
			recognition.lang = 'he-IL';
			console.log(
				'🔄 [START_LISTENING] Setting recognition language to Hebrew (he-IL)'
			);
			if (recognizedTextEl) recognizedTextEl.style.direction = 'rtl';
		} else if (currentStage === 'translation') {
			recognition.lang = 'en-US';
			console.log(
				'🔄 [START_LISTENING] Setting recognition language to English (en-US)'
			);
			if (recognizedTextEl) recognizedTextEl.style.direction = 'ltr';
		}

		try {
			if (startTimerId) {
				clearTimeout(startTimerId);
				startTimerId = null;
				console.log('⏹️ [START_LISTENING] Cleared previous start timer');
			}
			// allow auto-restart from here on
			allowAutoRestart = true;
			resultAccepted = false; // reset fast-pass guard at (re)start

			if (immediate) {
				console.log('🎤 [START_LISTENING] Immediate start (no timeout)');
				console.log(
					`🎤 [START_LISTENING] Starting recognition with language: ${recognition.lang}`
				);
				recognition.start();
			} else {
				console.log(
					'⏰ [START_LISTENING] Setting 100ms timeout before starting recognition'
				);
				startTimerId = setTimeout(() => {
					console.log(
						'⏰ [START_LISTENING] Timeout triggered - checking conditions'
					);
					console.log(`   Recognition exists: ${!!recognition}`);
					console.log(`   Is listening: ${isListening}`);
					console.log(`   Current stage: ${currentStage}`);

					if (
						recognition &&
						!isListening &&
						(currentStage === 'hebrew' || currentStage === 'translation')
					) {
						console.log(
							`🎤 [START_LISTENING] Starting recognition with language: ${recognition.lang}`
						);
						recognition.start();
					} else {
						console.log(
							'❌ [START_LISTENING] Not starting recognition - conditions not met'
						);
					}
				}, 100);
			}
		} catch (e) {
			console.error('❌ [START_LISTENING] Recognition start error:', e);
		}
	} else {
		console.log(
			'❌ [START_LISTENING] Not starting - recognition missing or already listening'
		);
	}
}

function stopListening() {
	console.log('🛑 [STOP_LISTENING] Function called');
	console.log(`   Recognition exists: ${!!recognition}`);
	console.log(`   Is listening: ${isListening}`);
	console.log(`   Current stage: ${currentStage}`);
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	// Suppress auto-restart during intentional stop and clear timers
	allowAutoRestart = false;
	if (restartTimerId) {
		clearTimeout(restartTimerId);
		restartTimerId = null;
		console.log('⏹️ [STOP_LISTENING] Cleared pending restart timer');
	}
	if (startTimerId) {
		clearTimeout(startTimerId);
		startTimerId = null;
		console.log('⏹️ [STOP_LISTENING] Cleared pending start timer');
	}

	if (recognition && isListening) {
		console.log('🛑 [STOP_LISTENING] Stopping recognition');
		recognition.stop();
	} else {
		console.log(
			'❌ [STOP_LISTENING] Not stopping - recognition missing or not listening'
		);
	}

	console.log(
		'🎨 [STOP_LISTENING] Keeping visualizer visible; hiding feedback'
	);
	// Keep visualizer visible during gameplay; just hide the recognition feedback box
	hideRecognitionFeedback();
	// While in-game, show a passive status so the word doesn't jump
	try {
		if (
			currentStage === 'hebrew' ||
			currentStage === 'english' ||
			currentStage === 'start-english'
		) {
			updateStatus(
				'<div class="listening off"><span class="mic-indicator"></span>Not listening…</div>'
			);
		}
	} catch (_) {}
}

// Speech handling
function handleSpeechResult(alternatives) {
	console.log('🎯 [HANDLE_SPEECH] Function called');
	console.log(`   Timestamp: ${new Date().toISOString()}`);
	console.log(`   Current word index: ${currentWordIndex}`);
	console.log(`   Current stage: ${currentStage}`);

	const currentWord = words[currentWordIndex];

	console.log('📊 [HANDLE_SPEECH] Input data:');
	console.log('   Speech alternatives:', alternatives);
	console.log('   Current word object:', currentWord);
	console.log(`   Display Hebrew: "${currentWord.he}"`);
	console.log(`   Display English: "${currentWord.en}"`);
	console.log('   Hebrew alternatives:', currentWord.he_alternatives);
	console.log('   English alternatives:', currentWord.en_alternatives);

	if (currentStage === 'hebrew') {
		const hebrewMatch = alternatives.some((alt) => {
			console.log(
				`Comparing speech: "${alt}" with expected alternatives:`,
				currentWord.he_alternatives
			);

			const matchFound = currentWord.he_alternatives.some((hebrewAlt) => {
				const exactContains = alt
					.toLowerCase()
					.includes(hebrewAlt.toLowerCase());
				const altNoVowels = alt
					.replace(/[\u05B0-\u05C7\u05C8-\u05CF]/g, '')
					.toLowerCase();
				const hebrewAltNoVowels = hebrewAlt
					.replace(/[\u05B0-\u05C7\u05C8-\u05CF]/g, '')
					.toLowerCase();
				const noVowelsContains = altNoVowels.includes(hebrewAltNoVowels);

				if (exactContains || noVowelsContains) {
					console.log(`✅ Match found with alternative: "${hebrewAlt}"`);
					console.log(`   Speech: "${alt}" | Alternative: "${hebrewAlt}"`);
					console.log(
						`   Exact contains: ${exactContains} | No vowels contains: ${noVowelsContains}`
					);
					return true;
				}
				return false;
			});

			return matchFound;
		});

		console.log(`🔍 [HANDLE_SPEECH] Hebrew match result: ${hebrewMatch}`);

		if (hebrewMatch) {
			console.log(
				'✅ [HANDLE_SPEECH] CORRECT Hebrew word detected! Moving to translation stage...'
			);
			console.log(
				`   Calling handleCorrectHebrew() at ${new Date().toISOString()}`
			);
			handleCorrectHebrew();
		} else {
			console.log(
				'❌ [HANDLE_SPEECH] Hebrew word not matched. Staying on current word.'
			);
			console.log('   No action taken - waiting for correct pronunciation');
		}
	} else if (currentStage === 'translation') {
		const englishMatch = alternatives.some((alt) => {
			console.log(
				`Comparing English speech: "${alt}" with expected alternatives:`,
				currentWord.en_alternatives
			);

			const matchFound = currentWord.en_alternatives.some((englishAlt) => {
				const containsMatch = alt
					.toLowerCase()
					.includes(englishAlt.toLowerCase());

				if (containsMatch) {
					console.log(
						`✅ English match found with alternative: "${englishAlt}"`
					);
					console.log(`   Speech: "${alt}" | Alternative: "${englishAlt}"`);
					return true;
				}
				return false;
			});

			return matchFound;
		});

		console.log(`🔍 [HANDLE_SPEECH] English match result: ${englishMatch}`);

		if (englishMatch) {
			console.log(
				'✅ [HANDLE_SPEECH] CORRECT English translation detected! Moving to next word...'
			);
			console.log(
				`   Calling handleCorrectTranslation() at ${new Date().toISOString()}`
			);
			handleCorrectTranslation();
		} else {
			console.log(
				'❌ [HANDLE_SPEECH] English translation not matched. Staying on current word.'
			);
			console.log('   No action taken - waiting for correct pronunciation');
		}
	}
}
