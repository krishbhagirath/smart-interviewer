'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import PNGTuberMascot from '@/components/PNGTuberMascot';

// Import Data
import questionsData from '@/data/questions.json';
import transitionsData from '@/data/transitions.json';

export default function InterviewPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState(null);

  // Camera State
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const videoRef = useRef(null);

  // Interview Logic State
  // States: 'INIT', 'READY', 'INTERVIEW', 'COMPLETE'
  const [interviewState, setInterviewState] = useState('INIT');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio Queue
  const audioQueueRef = useRef(Promise.resolve());

  // --- Setup & Camera Logic ---

  useEffect(() => {
    const data = localStorage.getItem('interviewSetup');
    if (!data) {
      router.push('/');
      return;
    }
    setSetupData(JSON.parse(data));
    setStatusText("Click Start to begin.");
  }, [router]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    // Auto-start camera on load if desired, or wait for user?
    // User flow: They accept permissions via button.
    return () => {
      stopCamera();
    };
  }, []);

  // --- Audio Engine ---

  const speak = (text) => {
    // Append to queue
    audioQueueRef.current = audioQueueRef.current.then(async () => {
      try {
        setIsSpeaking(true);
        console.log('Speaking:', text);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        if (!res.ok) throw new Error(await res.text());

        const arrayBuffer = await res.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        return new Promise((resolve) => {
          audio.onended = () => {
            setIsSpeaking(false);
            resolve();
            URL.revokeObjectURL(url);
          };
          audio.onerror = (e) => {
            console.error("Audio playback error", e);
            setIsSpeaking(false);
            resolve();
          };
          audio.play().catch(e => {
            console.error("Auto-play blocked?", e);
            setIsSpeaking(false);
            resolve();
          });
        });
      } catch (err) {
        console.error('TTS Error:', err);
        setIsSpeaking(false);
      }
    });
  };

  // --- Interaction Handlers ---

  const handleStart = () => {
    // If camera not started, maybe force it? 
    // For now, assume they clicked the camera button first or we can auto-trigger it.
    if (!permissionGranted) {
      setError("Please enable your camera first.");
      return;
    }

    setInterviewState('READY');
    setStatusText("Are you ready to start?");
    speak("Hello, are you ready to start your interview?");
  };

  const handleReady = () => {
    setInterviewState('INTERVIEW');
    setCurrentQuestionIndex(0);
    const firstQ = questionsData.questions[0];
    setStatusText(`Question 1 of ${questionsData.total}: ${firstQ.text}`);
    speak(firstQ.text);
  };

  const handleNext = () => {
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

      // Queue transition then question
      speak(transition);
      speak(nextQ.text);
    }
  };

  const handleExit = () => {
    router.push('/');
  };

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
              interviewState === 'COMPLETE' ? 'bg-green-500/20 text-green-200' : 'bg-white/10 text-white/50'
              }`}>
              {interviewState}
            </div>
          </div>

          {/* Zoom-style Meeting Layout */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mascot (Left) - Rectangular */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PNGTuberMascot isPlaying={isSpeaking} />
                </div>
                {/* Name label like Zoom */}
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded">
                  <span className="text-white text-sm font-medium">AI Interviewer</span>
                </div>
              </div>

              {/* Video Preview (Right) - Rectangular */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute top-0 left-0 w-full h-full object-cover ${permissionGranted ? 'block' : 'hidden'}`}
                />

                {!permissionGranted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-white/70 mb-4">Camera preview will appear here</p>
                      <GlassButton onClick={startCamera}>
                        Enable Camera & Microphone
                      </GlassButton>
                    </div>
                  </div>
                )}

                {permissionGranted && (
                  <>
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full z-10">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium">Rec</span>
                    </div>
                    {/* Name label like Zoom */}
                    <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded">
                      <span className="text-white text-sm font-medium">You</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Dynamic Status / Question Text */}
          <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10 min-h-[100px] flex items-center justify-center text-center">
            <h2 className="text-xl md:text-2xl text-white font-medium">
              {statusText}
            </h2>
          </div>

          {/* Controls */}
          {permissionGranted && (
            <div className="flex gap-4 justify-center">

              {interviewState === 'INIT' && (
                <GlassButton onClick={handleStart} size="large" variant="primary" disabled={isSpeaking}>
                  Start Interview
                </GlassButton>
              )}

              {interviewState === 'READY' && (
                <GlassButton onClick={handleReady} size="large" variant="primary" disabled={isSpeaking}>
                  Yes! Let's Begin
                </GlassButton>
              )}

              {interviewState === 'INTERVIEW' && (
                <GlassButton onClick={handleNext} size="large" variant="primary" disabled={isSpeaking}>
                  Done → Next Question
                </GlassButton>
              )}

              {interviewState === 'COMPLETE' && (
                <GlassButton onClick={handleExit} size="large" variant="secondary">
                  Exit to Home
                </GlassButton>
              )}
            </div>
          )}

          {/* Instructions (Bottom) */}
          {!permissionGranted && (
            <div className="mt-8 p-4 bg-white/5 rounded-lg text-center">
              <p className="text-white/70 text-sm">
                Enable your camera to begin the session.
              </p>
            </div>
          )}

        </GlassCard>
      </div>
    </main>
  );
}
