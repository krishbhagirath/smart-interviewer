// DOM Elements
const startBtn = document.getElementById('start-btn');
const readyBtn = document.getElementById('ready-btn');
const nextBtn = document.getElementById('next-btn');
const resetBtn = document.getElementById('reset-btn');
const statusBadge = document.getElementById('status-badge');
const questionDisplay = document.getElementById('question-display');

// Data
let questions = [];
let transitions = [];

// State
let currentState = 'LANDING'; // LANDING, READY, INTERVIEW, COMPLETE
let currentQuestionIndex = 0; // 0-based
let audioQueue = Promise.resolve();

// --- Initialization ---

async function init() {
    try {
        const [qRes, tRes] = await Promise.all([
            fetch('/questions.json'),
            fetch('/transitions.json')
        ]);

        const qData = await qRes.json();
        questions = qData.questions;
        transitions = await tRes.json();

        console.log(`Loaded ${questions.length} questions and ${transitions.length} transitions.`);
    } catch (err) {
        console.error("Failed to load data", err);
        questionDisplay.textContent = "Error loading interview data.";
    }
}

// --- Audio Engine ---

function speak(text) {
    // Chain promises to ensure sequential playback
    audioQueue = audioQueue.then(async () => {
        try {
            console.log('Speaking:', text);
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!res.ok) throw new Error(await res.text());

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            return new Promise((resolve) => {
                audio.onended = () => {
                    resolve();
                    URL.revokeObjectURL(url);
                };
                audio.onerror = (e) => {
                    console.error("Audio playback error", e);
                    resolve(); // Resolve anyway to not block queue
                };
                audio.play().catch(e => {
                    console.error("Auto-play blocked?", e);
                    resolve();
                });
            });
        } catch (err) {
            console.error('TTS Error:', err);
        }
    });
}

// --- Flow Logic ---

function setStatus(text, type) {
    statusBadge.textContent = text;
    statusBadge.className = 'status-badge';
    if (type) statusBadge.classList.add(type);
}

function updateUI() {
    // Hide all first
    startBtn.classList.add('hidden');
    readyBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');

    switch (currentState) {
        case 'LANDING':
            startBtn.classList.remove('hidden');
            questionDisplay.textContent = "Welcome. Click Start to begin.";
            setStatus("Idle");
            break;
        case 'READY':
            readyBtn.classList.remove('hidden');
            questionDisplay.textContent = "Are you ready to start?";
            setStatus("Preparing", "active");
            break;
        case 'INTERVIEW':
            nextBtn.classList.remove('hidden');
            const q = questions[currentQuestionIndex];
            questionDisplay.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}: ${q.text}`;
            setStatus(`Question ${currentQuestionIndex + 1} / ${questions.length}`, "active");
            break;
        case 'COMPLETE':
            resetBtn.classList.remove('hidden');
            questionDisplay.textContent = "Interview Complete.";
            setStatus("Completed", "complete");
            break;
    }
}

// --- Event Handlers ---

startBtn.addEventListener('click', () => {
    currentState = 'READY';
    updateUI();
    speak("Hello, are you ready to start your interview?");
});

readyBtn.addEventListener('click', () => {
    currentState = 'INTERVIEW';
    currentQuestionIndex = 0;
    updateUI();
    speak(questions[0].text);
});

nextBtn.addEventListener('click', () => {
    // Disable button briefly to prevent double clicks (optional)
    nextBtn.disabled = true;
    setTimeout(() => nextBtn.disabled = false, 2000);

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
        currentState = 'COMPLETE';
        updateUI();
        speak("Thank you for completing your practice interview. Your analysis will be generated shortly.");
    } else {
        // Normal transition
        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        const reqIndex = currentQuestionIndex + 1; // Prepare next

        // 1. Speak Transition
        speak(transition);

        // 2. Speak Next Question
        const nextQ = questions[reqIndex];
        speak(nextQ.text);

        // Update State immediately or after delay? Immediately is snappier for UI
        currentQuestionIndex++;
        updateUI();
    }
});

resetBtn.addEventListener('click', () => {
    currentState = 'LANDING';
    currentQuestionIndex = 0;
    updateUI();
});

// Start
init();
