'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
// import GradientBackground from '@/components/ui/GradientBackground'; // Removed
// import GlassCard from '@/components/ui/GlassCard'; // Removed
// import GlassButton from '@/components/ui/GlassButton'; // Removed
import PNGTuberMascot from '@/components/PNGTuberMascot';
import AudioVisualizer from '@/components/ui/AudioVisualizer';
import CameraFeed from '@/components/CameraFeed';
import FeedbackOverlay from '@/components/ui/FeedbackOverlay';

// Import Data
import questionsData from '@/data/questions.json';
import transitionsData from '@/data/transitions.json';

export default function InterviewPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState(null);

  // --- State from HEAD (Vitals) ---
  const [vitals, setVitals] = useState({ pulse: 0, breathing: 0 });
  const [isSessionActive, setIsSessionActive] = useState(false);

  // --- State from Feature (Audio/Cam) ---
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [feedbackText, setFeedbackText] = useState(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  // --- Shared State ---
  const [interviewState, setInterviewState] = useState('INIT');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- Refs ---
  const audioQueueRef = useRef(Promise.resolve());
  const audioInstanceRef = useRef(null); // Ref to hold current Audio object for cancellation
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isAudioRecordingRef = useRef(false);

  // --- Setup Logic ---
  useEffect(() => {
    const data = localStorage.getItem('interviewSetup');
    if (!data) {
      router.push('/');
      return;
    }
    setSetupData(JSON.parse(data));
    setSessionId(Date.now().toString());
    setStatusText("Click Start to begin.");

    // Vitals Polling
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/vitals', { cache: 'no-store' });
        if (res.ok) {
          const vData = await res.json();
          setVitals(vData);
        }
      } catch (err) { }
    }, 500);

    return () => {
      clearInterval(interval);
      stopAudioRecording();
      if (audioInstanceRef.current) {
        audioInstanceRef.current.pause();
        audioInstanceRef.current = null;
      }
    };
  }, [router]);

  // --- Logic Helper: Get Questions ---
  const getQuestions = () => {
    if (!setupData) return [];

    let type = setupData.interviewType;

    // Mapping unique UI IDs to shared Question Data keys
    const MAPPING = {
      'frontend-engineering': 'full-stack',
      'backend-engineering': 'full-stack',
      'fullstack-engineering': 'full-stack',
      'behavioral-general': 'behavioral',
      'behavioral-leadership': 'behavioral',
      'behavioral-teamwork': 'behavioral',
      'infrastructure': 'nokia-infra',
      'ai-ml': 'shopify-ml-intern',
      'cybersecurity': 'technical'
    };

    // If type is in mapping, use mapped key. Otherwise, check if it exists directly (e.g. ticker roles).
    const questionKey = MAPPING[type] || type;

    return questionsData[questionKey] || questionsData['general'];
  };

  // --- Audio Queue & TTS ---
  const speak = (text) => {
    stopAudioRecording();

    // Stop any existing audio instantly
    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current = null;
    }

    audioQueueRef.current = audioQueueRef.current.then(async () => {
      try {
        setIsSpeaking(true);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioInstanceRef.current = audio; // Save ref

        return new Promise((resolve) => {
          audio.onended = () => {
            setIsSpeaking(false);
            audioInstanceRef.current = null;
            resolve();
            URL.revokeObjectURL(url);
          };
          audio.onerror = () => { setIsSpeaking(false); resolve(); };
          audio.play().catch(() => { setIsSpeaking(false); resolve(); });
        });
      } catch (err) {
        console.error('TTS Error:', err);
        setIsSpeaking(false);
      }
    });
  };

  // --- Microphone Logic (Audio Only) ---
  const startMicrophone = async () => {
    try {
      // REQUEST AUDIO ONLY - Camera is handled by C++ Backend
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setStream(mediaStream);
      setPermissionGranted(true);
      setError('');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please grant permissions.');
    }
  };

  // --- Vitals Start (HEAD) ---
  const startVitalsSession = async (action = 'START') => {
    try {
      await fetch('/api/start-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      setIsSessionActive(true);
      console.log(`Vitals Session Triggered: ${action}`);
    } catch (error) {
      console.error('Error starting vitals session:', error);
    }
  };

  // --- Recording Logic ---
  const startAudioRecording = () => {
    if (!stream || isAudioRecordingRef.current) return;
    try {
      // Stream is Audio-only now, so just use it directly
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options = { mimeType: 'audio/webm;codecs=opus' };
      else if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start();
      isAudioRecordingRef.current = true;
      console.log("Recording STARTED");
    } catch (e) {
      console.error("Mic Error:", e);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      isAudioRecordingRef.current = false;
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const stopRecordingAndTranscribe = async () => {
    if (!isAudioRecordingRef.current) return;

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) { resolve(); return; }

      recorder.onstop = async () => {
        setIsTranscribing(true);
        let result = null;
        const type = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });

        try {
          const base64 = await blobToBase64(audioBlob);
          result = await sendToGoogle(base64);
        } catch (e) { console.error(e); }
        finally {
          setIsTranscribing(false);
          resolve(result);
        }
      };
      recorder.stop();
      isAudioRecordingRef.current = false;
    });
  };

  const sendToGoogle = async (base64Audio) => {
    const qIndex = currentQRef.current;
    let qLogId = (qIndex + 1).toString();
    if (stateRef.current === 'READY') qLogId = "Intro";

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Audio,
          questionId: qLogId,
          sessionId: sessionId,
          interviewType: setupData?.interviewType,
          experienceLevel: setupData?.experienceLevel
        })
      });
      const data = await res.json();
      return data.transcript;
    } catch (e) { console.error(e); return null; }
  };

  // Refs for closure access
  const currentQRef = useRef(0);
  useEffect(() => { currentQRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  const stateRef = useRef(interviewState);
  useEffect(() => { stateRef.current = interviewState; }, [interviewState]);


  // --- Interaction Handlers ---

  const handleStart = async () => {
    // Start Microphone (Audio Only)
    await startMicrophone();
  };

  const handleInterviewStart = () => {
    // DO NOT start vitals here (User Step 1: Confirm)

    setInterviewState('READY');
    setStatusText("Are you ready to start?");
    speak("Hello, are you ready to start your interview?");

    audioQueueRef.current.then(() => {
      startAudioRecording();
    });
  };

  const currentQuestions = getQuestions();
  const totalQuestions = currentQuestions.length;


  const handleReady = () => {
    startVitalsSession('START'); // Trigger C++ Backend (Start Q1)

    if (isAudioRecordingRef.current && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      isAudioRecordingRef.current = false;
    }
    audioChunksRef.current = [];

    setInterviewState('INTERVIEW');
    setCurrentQuestionIndex(0);

    // Use dynamic Questions
    const firstQ = currentQuestions[0];
    setStatusText(`Question 1 of ${totalQuestions}: ${firstQ.text}`);

    speak(firstQ.text);
    audioQueueRef.current.then(() => {
      startAudioRecording();
    });
  };

  const handleNext = async () => {
    const transcript = await stopRecordingAndTranscribe();

    // Fire-and-forget Feedback Request
    if (transcript) {
      setFeedbackText(null);
      setIsFeedbackLoading(true);
      const currentQText = currentQuestions[currentQuestionIndex].text;

      fetch('/api/quick-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: currentQText, answerText: transcript })
      })
        .then(res => res.json())
        .then(data => {
          if (data.feedback) setFeedbackText(data.feedback);
        })
        .catch(err => console.error("Feedback fetch failed:", err))
        .finally(() => setIsFeedbackLoading(false));
    }

    const isLast = currentQuestionIndex === totalQuestions - 1;

    if (isLast) {
      setInterviewState('COMPLETE');
      setStatusText("Interview Complete. Generating Report...");
      startVitalsSession('STOP'); // Trigger C++: STOP Recording
      speak("Thank you. We are analyzing your responses now.");

      // Navigate to Report Page after a short delay for effect
      setTimeout(() => {
        router.push(`/report?sessionId=${sessionId}`);
      }, 3000);

    } else {
      const nextIndex = currentQuestionIndex + 1;
      const transition = transitionsData[Math.floor(Math.random() * transitionsData.length)];
      const nextQ = currentQuestions[nextIndex];

      setStatusText(`Question ${nextIndex + 1} of ${totalQuestions}: ${nextQ.text}`);
      setCurrentQuestionIndex(nextIndex);

      startVitalsSession('NEXT'); // Trigger C++ Backend (Next Question)

      speak(transition);
      speak(nextQ.text);

      audioQueueRef.current.then(() => {
        startAudioRecording();
      });
    }
  };

  const handleViewResults = () => {
    startVitalsSession('STOP');
    router.push(`/results?sessionId=${sessionId}`);
  };

  const handleSkipToHome = () => {
    startVitalsSession('STOP');
    // Stop Audio
    if (audioInstanceRef.current) {
      audioInstanceRef.current.pause();
      audioInstanceRef.current = null;
    }
    router.push('/');
  };


  if (!setupData) return null;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/30">
            <span className="text-2xl">🤖</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Hiready</span>
        </div>
        <button onClick={handleSkipToHome} className="text-slate-500 hover:text-red-600 font-medium text-sm transition-colors flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Exit Session
        </button>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: User Camera (MAIN STAGE - Span 8) */}
        <div className="lg:col-span-8 space-y-6">

          <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-200 overflow-hidden relative aspect-video group">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-6 z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isAudioRecordingRef.current ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span className="text-white font-bold text-lg tracking-wide shadow-black/50 drop-shadow-md">
                    {setupData.customTitle || 'Your Camera Feed'}
                  </span>
                </div>
              </div>
              {!permissionGranted && (
                <div className="px-4 py-1.5 rounded-full text-sm font-bold bg-red-500/80 text-white border border-white/20">
                  Mic Off
                </div>
              )}
            </div>

            {/* Camera Feed Area */}
            <div className="w-full h-full bg-black relative">
              <div className="absolute inset-0 w-full h-full">
                <CameraFeed />
                <FeedbackOverlay feedback={feedbackText} isLoading={isFeedbackLoading} />
              </div>

              {!permissionGranted && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
                  <button onClick={handleStart} className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition-all shadow-lg scale-110">
                    Enable Microphone / Camera
                  </button>
                </div>
              )}

              {/* Audio Viz Overlay */}
              {permissionGranted && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10 flex items-end pb-4 px-8">
                  <div className="w-full h-12 opacity-90">
                    <AudioVisualizer stream={stream} isListening={!isSpeaking && !isTranscribing} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons (Under Main Video) */}
          {permissionGranted && (
            <div className="grid grid-cols-1 gap-4">
              {interviewState === 'INIT' && (
                <button onClick={handleInterviewStart} disabled={isSpeaking}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-3">
                  <span>▶</span> Start Session
                </button>
              )}
              {interviewState === 'READY' && (
                <button onClick={handleReady} disabled={isSpeaking}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-6 rounded-2xl shadow-xl shadow-green-600/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-3">
                  <span>✓</span> I'm Ready, Let's Begin
                </button>
              )}
              {interviewState === 'INTERVIEW' && (
                <button onClick={handleNext} disabled={isSpeaking || isTranscribing}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.01] flex items-center justify-center gap-3 ${isTranscribing ? 'opacity-70 cursor-wait' : ''}`}>
                  {isTranscribing ? (
                    <><span>⟳</span> Processing Answer...</>
                  ) : (
                    <><span>➤</span> Submit Answer & Next</>
                  )}
                </button>
              )}
              {interviewState === 'COMPLETE' && (
                <div className="flex gap-4">
                  <button onClick={handleViewResults} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition-all">
                    View Detailed Report
                  </button>
                  <button onClick={handleSkipToHome} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-lg font-bold py-4 rounded-xl transition-all">
                    Return Home
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Bot + Vitals (Sidebar - Span 4) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">

          {/* AI Interviewer (Smaller View) */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative aspect-video">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">AI Interviewer</h3>
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </div>

            <div className="w-full h-full bg-slate-900 flex items-center justify-center relative p-4">
              <div className="relative w-40 h-40">
                <PNGTuberMascot isPlaying={isSpeaking} />
              </div>
            </div>

            {/* Questions Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-4 max-h-[40%] overflow-y-auto">
              <p className="text-white text-sm font-medium leading-relaxed text-center">
                {statusText}
              </p>
            </div>
          </div>

          {/* Vitals */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 flex-1">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">❤️</span>
              <h3 className="text-lg font-bold text-slate-800">Live Biometrics</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 transition-all hover:bg-red-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-red-500 font-bold text-sm uppercase">Heart Rate</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${vitals.pulse > 100 ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                    {vitals.pulse > 100 ? 'High' : 'Normal'}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-slate-800 tracking-tight">{vitals.pulse > 0 ? vitals.pulse : '--'}</span>
                  <span className="text-slate-400 font-medium mb-1">BPM</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 transition-all hover:bg-blue-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-500 font-bold text-sm uppercase">Breathing</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${vitals.breathing > 20 ? 'bg-yellow-200 text-yellow-700' : 'bg-green-200 text-green-700'}`}>
                    {vitals.breathing > 20 ? 'Rapid' : 'Calm'}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-slate-800 tracking-tight">{vitals.breathing > 0 ? vitals.breathing : '--'}</span>
                  <span className="text-slate-400 font-medium mb-1">RPM</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Real-time stress analysis provided by <span className="font-bold text-slate-600">Presage™</span> technology.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
