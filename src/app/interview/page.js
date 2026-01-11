'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import PNGTuberMascot from '@/components/PNGTuberMascot';
import AudioVisualizer from '@/components/ui/AudioVisualizer';

// Import Data
import questionsData from '@/data/questions.json';
import transitionsData from '@/data/transitions.json';

export default function InterviewPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState(null);

  // --- State from HEAD (Vitals) ---
  const [vitals, setVitals] = useState({ pulse: 0, breathing: 0 });
  // Note: HEAD used isRecording for Vitals status. We'll rename local recording state to avoid confusion.
  // actually HEAD `isRecording` was for "Is Session Active".
  const [isSessionActive, setIsSessionActive] = useState(false);

  // --- State from Feature (Audio/Cam) ---
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const videoRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // --- Shared State ---
  const [interviewState, setInterviewState] = useState('INIT');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- Refs ---
  const audioQueueRef = useRef(Promise.resolve());
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

    // Vitals Polling (HEAD)
    const interval = setInterval(async () => {
      // Only poll if session is active? HEAD polled always but state likely empty.
      // We'll keep HEAD logic:
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
      stopCamera();
      stopAudioRecording();
    };
  }, [router]);

  // --- Camera Logic (Feature) ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setStream(mediaStream);
      setPermissionGranted(true);
      setError('');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera/microphone. Please grant permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setPermissionGranted(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  // --- Vitals Start (HEAD) ---
  const startVitalsSession = async () => {
    try {
      await fetch('/api/start-vitals', { method: 'POST' });
      setIsSessionActive(true);
      console.log('Vitals Session started');
    } catch (error) {
      console.error('Error starting vitals session:', error);
    }
  };

  // --- Audio Queue & TTS (Merged) ---
  const speak = (text) => {
    // Feature logic requires stopping recording before speaking?
    stopAudioRecording();

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

        return new Promise((resolve) => {
          audio.onended = () => {
            setIsSpeaking(false);
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

  // --- Recording Logic (Feature) ---
  const startAudioRecording = () => {
    if (!stream || isAudioRecordingRef.current) return;
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;
      const audioStream = new MediaStream(audioTracks);

      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options = { mimeType: 'audio/webm;codecs=opus' };
      else if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };

      const recorder = new MediaRecorder(audioStream, options);
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
        const type = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });

        try {
          const base64 = await blobToBase64(audioBlob);
          // Send to API
          await sendToGoogle(base64);
        } catch (e) { console.error(e); }
        finally {
          setIsTranscribing(false);
          resolve();
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
      await fetch('/api/transcribe', {
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
    } catch (e) { console.error(e); }
  };

  // Refs for closure access
  const currentQRef = useRef(0);
  useEffect(() => { currentQRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  const stateRef = useRef(interviewState);
  useEffect(() => { stateRef.current = interviewState; }, [interviewState]);


  // --- Interaction Handlers ---

  const handleStart = async () => {
    // Start Camera Logic (Request Permissions)
    await startCamera();

    // Note: we can't start vitals until permission granted? 
    // We will do it in sequence. After camera starts, valid stream exists.
  };

  // We need a secondary step? 
  // Feature logic: `startCamera` was manual button. Then `handleStart` was "Start Interview".
  // HEAD logic: `handleStart` was just "Start".
  // Merged: User clicks "Enable Camera". Then clicks "Start Interview".

  // If permission NOT granted, show button to enable.
  // If granted, show "Start Interview".

  const handleInterviewStart = () => {
    startVitalsSession(); // HEAD logic

    setInterviewState('READY');
    setStatusText("Are you ready to start?");
    speak("Hello, are you ready to start your interview?");

    audioQueueRef.current.then(() => {
      startAudioRecording();
    });
  };

  const handleReady = () => {
    // Stop intro recording
    if (isAudioRecordingRef.current && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      isAudioRecordingRef.current = false;
    }
    audioChunksRef.current = [];

    setInterviewState('INTERVIEW');
    setCurrentQuestionIndex(0);
    const firstQ = questionsData.questions[0];
    setStatusText(`Question 1 of ${questionsData.total}: ${firstQ.text}`);

    speak(firstQ.text);
    audioQueueRef.current.then(() => {
      startAudioRecording();
    });
  };

  const handleNext = async () => {
    await stopRecordingAndTranscribe();

    const questions = questionsData.questions;
    const isLast = currentQuestionIndex === questions.length - 1;

    if (isLast) {
      setInterviewState('COMPLETE');
      setStatusText("Interview Complete.");
      speak("Thank you for completing your practice interview. Your analysis will be generated shortly.");
    } else {
      const nextIndex = currentQuestionIndex + 1;
      const transition = transitionsData[Math.floor(Math.random() * transitionsData.length)];
      const nextQ = questions[nextIndex];

      setStatusText(`Question ${nextIndex + 1} of ${questionsData.total}: ${nextQ.text}`);
      setCurrentQuestionIndex(nextIndex);

      speak(transition);
      speak(nextQ.text);

      audioQueueRef.current.then(() => {
        startAudioRecording();
      });
    }
  };

  const handleExit = () => { router.push('/'); };


  if (!setupData) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GradientBackground />

      <div className="w-full max-w-screen-2xl">
        <GlassCard className="p-8">

          {/* Header */}
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Interview Session</h1>
              <div className="flex gap-4 text-sm text-white/70">
                <span><strong>Type:</strong> {setupData.interviewType}</span>
                <span><strong>Level:</strong> {setupData.experienceLevel}</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold ${interviewState === 'INTERVIEW' ? 'bg-blue-500/20 text-blue-200' :
                interviewState === 'COMPLETE' ? 'bg-green-500/20 text-green-200' :
                  'bg-white/10 text-white/50'
              }`}>
              {interviewState}
            </div>
          </div>

          {/* Layout: Grid for Mascot & Video */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Mascot (Left) */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PNGTuberMascot isPlaying={isSpeaking} />
                </div>
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded">
                  <span className="text-white text-sm font-medium">AI Interviewer</span>
                </div>
              </div>

              {/* Video Preview (Right) - Manual Video Tag for Logic Control */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${permissionGranted ? 'block' : 'hidden'}`}
                />

                {!permissionGranted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-white/70 mb-4">Enable camera to start</p>
                      <GlassButton onClick={startCamera}>
                        Enable Camera & Microphone
                      </GlassButton>
                    </div>
                  </div>
                )}

                {permissionGranted && (
                  <>
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full z-10">
                      <div className={`w-3 h-3 bg-white rounded-full ${isSpeaking ? '' : 'animate-pulse'}`}></div>
                      <span className="text-white text-sm font-medium">
                        {isSpeaking ? 'Agent Speaking' : isTranscribing ? 'Processing...' : 'Live & Rec'}
                      </span>
                    </div>

                    {/* Audio Visualizer Overlay on YOU */}
                    <div className="absolute bottom-4 left-4 right-4 h-16 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 pointer-events-none">
                      <AudioVisualizer stream={stream} isListening={!isSpeaking && !isTranscribing} />
                    </div>
                  </>
                )}

                {isTranscribing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                    <div className="text-white font-medium animate-pulse">Transcribing...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vitals Data (Below Grid) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm border border-white/5">
              <span className="text-white/60 text-sm mb-1 uppercase tracking-wider">Heart Rate</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${vitals.pulse > 100 ? 'text-red-500' : vitals.pulse >= 60 ? 'text-yellow-400' : 'text-green-500'}`}>
                  {vitals.pulse > 0 ? vitals.pulse : '--'}
                </span>
                <span className="text-white/60 text-sm">BPM</span>
              </div>
              <span className="text-xs text-white/40 mt-1">
                {vitals.pulse > 100 ? 'Stress' : vitals.pulse >= 60 ? 'Normal' : 'Relaxed'}
              </span>
            </div>
            <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm border border-white/5">
              <span className="text-white/60 text-sm mb-1 uppercase tracking-wider">Breathing Rate</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${vitals.breathing > 20 ? 'text-red-500' : vitals.breathing >= 12 ? 'text-yellow-400' : 'text-green-500'}`}>
                  {vitals.breathing > 0 ? vitals.breathing : '--'}
                </span>
                <span className="text-white/60 text-sm">BPM</span>
              </div>
              <span className="text-xs text-white/40 mt-1">
                {vitals.breathing > 20 ? 'Stress' : vitals.breathing >= 12 ? 'Normal' : 'Deep Relaxation'}
              </span>
            </div>
          </div>


          {/* Status Text Area */}
          <div className="mb-6 p-6 bg-white/5 rounded-xl border border-white/10 min-h-[100px] flex items-center justify-center text-center">
            <h2 className="text-xl md:text-2xl text-white font-medium">
              {statusText}
            </h2>
          </div>

          {/* Controls */}
          {permissionGranted && (
            <div className="flex gap-4 justify-center">
              {interviewState === 'INIT' && (
                <GlassButton onClick={handleInterviewStart} size="large" variant="primary" disabled={isSpeaking}>
                  Start Interview
                </GlassButton>
              )}
              {interviewState === 'READY' && (
                <GlassButton onClick={handleReady} size="large" variant="primary" disabled={isSpeaking}>
                  Yes! Let's Begin
                </GlassButton>
              )}
              {interviewState === 'INTERVIEW' && (
                <GlassButton onClick={handleNext} size="large" variant="primary" disabled={isSpeaking || isTranscribing}>
                  {isTranscribing ? 'Saving...' : 'Done → Next Question'}
                </GlassButton>
              )}
              {interviewState === 'COMPLETE' && (
                <GlassButton onClick={handleExit} size="large" variant="secondary">
                  Exit to Home
                </GlassButton>
              )}
            </div>
          )}

          {!permissionGranted && (
            <div className="mt-8 p-4 bg-white/5 rounded-lg text-center">
              <p className="text-white/70 text-sm">
                Enable your camera to see the interface.
              </p>
            </div>
          )}

        </GlassCard>
      </div>
    </main>
  );
}
