'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import PNGTuberMascot from '@/components/PNGTuberMascot';
import AudioVisualizer from '@/components/ui/AudioVisualizer';
import CameraFeed from '@/components/CameraFeed';

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
    };
  }, [router]);

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

  // --- Audio Queue & TTS ---
  const speak = (text) => {
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
        const type = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });

        try {
          const base64 = await blobToBase64(audioBlob);
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

  const handleReady = () => {
    startVitalsSession('START'); // Trigger C++ Backend (Start Q1)

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
      startVitalsSession('STOP'); // Trigger C++: STOP Recording for Q5/Last Q
      speak("Thank you for completing your practice interview. Your analysis will be generated shortly.");
    } else {
      const nextIndex = currentQuestionIndex + 1;
      const transition = transitionsData[Math.floor(Math.random() * transitionsData.length)];
      const nextQ = questions[nextIndex];

      setStatusText(`Question ${nextIndex + 1} of ${questionsData.total}: ${nextQ.text}`);
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
    router.push('/');
  };


  if (!setupData) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GradientBackground />

      <div className="w-full max-w-screen-2xl">
        <GlassCard className="p-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Interview Session</h1>
            <div className="flex gap-4 text-sm text-white/70">
              <span><strong>Type:</strong> {setupData.interviewType}</span>
              <span><strong>Level:</strong> {setupData.experienceLevel}</span>
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
                  <span className="text-white text-sm font-medium">Nemo the Interviewer</span>
                </div>
              </div>

              {/* Video Preview (Right) - USES BACKEND CameraFeed */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">

                {/* 1. The MJPEG Stream from C++ */}
                <div className="absolute inset-0 w-full h-full">
                  <CameraFeed />
                </div>

                {!permissionGranted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎤</div>
                      <p className="text-white/70 mb-4">Enable microphone to start</p>
                      <GlassButton onClick={handleStart}>
                        Enable Microphone
                      </GlassButton>
                    </div>
                  </div>
                )}

                {permissionGranted && (
                  <>
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-600/90 px-3 py-1 rounded-full z-10 shadow-lg shadow-blue-500/50">
                      <div className={`w-3 h-3 bg-white rounded-full ${isSpeaking ? '' : 'animate-pulse'}`}></div>
                      <span className="text-white text-sm font-medium">
                        {isSpeaking ? 'Agent Speaking' : isTranscribing ? 'Processing...' : 'Live'}
                      </span>
                    </div>

                    {/* Audio Visualizer Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 h-16 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 pointer-events-none z-10">
                      <AudioVisualizer stream={stream} isListening={!isSpeaking && !isTranscribing} />
                    </div>
                  </>
                )}

                {isTranscribing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-20">
                    <div className="text-white font-medium animate-pulse">Transcribing...</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vitals Data (Below Grid) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-950/50 rounded-lg p-3 flex flex-col items-center justify-center backdrop-blur-sm border border-blue-500/40 shadow-lg shadow-blue-500/20">
              <span className="text-blue-200 text-xs mb-1 uppercase tracking-wider">Heart Rate</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${vitals.pulse > 100 ? 'text-red-400' : vitals.pulse >= 60 ? 'text-blue-400' : 'text-cyan-400'}`}>
                  {vitals.pulse > 0 ? vitals.pulse : '--'}
                </span>
                <span className="text-blue-300 text-xs">BPM</span>
              </div>
              <span className="text-xs text-blue-300 mt-0.5">
                {vitals.pulse > 100 ? 'Stress' : vitals.pulse >= 60 ? 'Normal' : 'Relaxed'}
              </span>
            </div>
            <div className="bg-blue-950/50 rounded-lg p-3 flex flex-col items-center justify-center backdrop-blur-sm border border-blue-500/40 shadow-lg shadow-blue-500/20">
              <span className="text-blue-200 text-xs mb-1 uppercase tracking-wider">Breathing Rate</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${vitals.breathing > 20 ? 'text-red-400' : vitals.breathing >= 12 ? 'text-blue-400' : 'text-cyan-400'}`}>
                  {vitals.breathing > 0 ? vitals.breathing : '--'}
                </span>
                <span className="text-blue-300 text-xs">BPM</span>
              </div>
              <span className="text-xs text-blue-300 mt-0.5">
                {vitals.breathing > 20 ? 'Stress' : vitals.breathing >= 12 ? 'Normal' : 'Deep Relaxation'}
              </span>
            </div>
          </div>

          {/* Status Text Area */}
          <div className="mb-6 p-6 bg-blue-950/40 rounded-xl border border-blue-500/30 min-h-[100px] flex items-center justify-center text-center shadow-lg shadow-blue-500/10">
            <h2 className="text-xl md:text-2xl text-blue-50 font-medium">
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
                <div className="flex gap-4">
                  <GlassButton onClick={handleViewResults} size="large" variant="primary">
                    View Feedback Report
                  </GlassButton>
                  <GlassButton onClick={handleSkipToHome} size="large" variant="secondary">
                    Skip to Home
                  </GlassButton>
                </div>
              )}
            </div>
          )}

          {!permissionGranted && (
            <div className="mt-8 p-4 bg-white/5 rounded-lg text-center">
              <p className="text-white/70 text-sm">
                Enable your microphone to begin.
              </p>
            </div>
          )}

        </GlassCard>
      </div>
    </main>
  );
}

