import { Conversation } from 'https://esm.sh/@elevenlabs/client';

// DOM Elements
const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const resetBtn = document.getElementById('reset-btn');
const statusText = document.getElementById('status-text');
const progressText = document.getElementById('progress-text');
const agentVisual = document.getElementById('agent-visual');

// State
let conversation = null;
let questions = [];
let currentQuestionIndex = -1;
let isInterviewActive = false;
let isInterviewCompleted = false;

// Constants
const AGENT_ID = '5501kemmt5mtesh9w6j17qqebyfg'; // As provided in the prompt

// Initialize
async function init() {
  try {
    const response = await fetch('./questions.json');
    questions = await response.json();
    console.log('Questions loaded:', questions);
  } catch (error) {
    console.error('Failed to load questions:', error);
    statusText.textContent = 'Error loading questions';
    startBtn.disabled = true;
  }
}

// Helper to update UI
function updateUI() {
  if (!isInterviewActive) {
    statusText.textContent = 'Idle';
    progressText.textContent = 'Ready to start';
    startBtn.disabled = false;
    nextBtn.disabled = true;
    agentVisual.classList.remove('active');
    return;
  }

  if (isInterviewCompleted) {
    statusText.textContent = 'Completed';
    progressText.textContent = 'Interview Finished';
    startBtn.disabled = true;
    nextBtn.disabled = true;
    agentVisual.classList.remove('active');
    return;
  }

  statusText.textContent = 'Interview in Progress';
  progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  startBtn.disabled = true;
  nextBtn.disabled = false;
  agentVisual.classList.add('active');
}

// Start Interview
startBtn.addEventListener('click', async () => {
  try {
    // Request microphone permission first
    await navigator.mediaDevices.getUserMedia({ audio: true });

    conversation = await Conversation.startSession({
      agentId: AGENT_ID,
      onModeChange: (mode) => {
        // mode is 'speaking' or 'listening'
        if (mode.mode === 'speaking') {
            agentVisual.classList.add('active');
        } else {
            agentVisual.classList.remove('active');
        }
      },
    });

    isInterviewActive = true;
    isInterviewCompleted = false;
    currentQuestionIndex = 0;
    
    // Send first question
    await sendQuestion(currentQuestionIndex);
    
    updateUI();
  } catch (error) {
    console.error('Failed to start interview:', error);
    statusText.textContent = 'Error starting interview';
    alert('Could not start the interview. Please ensure microphone access is allowed.');
  }
});

// Next Question
nextBtn.addEventListener('click', async () => {
  if (!conversation || !isInterviewActive) return;

  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    // Send next question
    await sendQuestion(currentQuestionIndex);
    updateUI();
  } else {
    // End interview
    await conversation.sendText('INTERVIEW_COMPLETE');
    isInterviewCompleted = true;
    updateUI();
    // Optional: End session after a short delay or keep it open for final remarks
    // await conversation.endSession(); 
  }
});

// Reset Interview
resetBtn.addEventListener('click', async () => {
  if (conversation) {
    await conversation.endSession();
    conversation = null;
  }
  
  isInterviewActive = false;
  isInterviewCompleted = false;
  currentQuestionIndex = -1;
  updateUI();
});

// Send Question Helper
async function sendQuestion(index) {
  const question = questions[index];
  const message = `CURRENT_INTERVIEW_QUESTION: ${question}`;
  console.log('Sending to agent:', message);
  await conversation.sendText(message);
}

// Start initialization
init();
