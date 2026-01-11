'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import CameraFeed from '@/components/CameraFeed';
import PNGTuberMascot from '@/components/PNGTuberMascot';

// Import Data
import questionsData from '@/data/questions.json';
import transitionsData from '@/data/transitions.json';

export default function InterviewPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState(null);

  // Vitals & Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [vitals, setVitals] = useState({ pulse: 0, breathing: 0 });

  // Interview Logic State
  const [interviewState, setInterviewState] = useState('INIT');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Audio Queue
  const audioQueueRef = useRef(Promise.resolve());

  // --- Setup & Vitals Logic ---

  useEffect(() => {
    const data = localStorage.getItem('interviewSetup');
    if (!data) {
      router.push('/');
      return;
    }
    setSetupData(JSON.parse(data));
    setStatusText("Click Start to begin.");
  }, [router]);

  // Vitals Polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/vitals', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setVitals(data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(interval);
  }, []);

  // Remote Trigger
  const startSession = async () => {
    try {
      const response = await fetch('/api/start-vitals', {
        method: 'POST',
      });

      if (response.ok) {
        setIsRecording(true);
        console.log('Session started');
      } else {
        console.error('Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // --- Audio Engine ---

  const speak = (text) => {
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
              <h1 className="text-3xl font-bold text-white mb-2">
                Interview Session
              </h1>
              <div className="flex gap-4 text-sm text-white/70">
                <span><strong>Type:</strong> {setupData.interviewType}</span>
                <span><strong>Level:</strong> {setupData.experienceLevel}</span>
              </div>
            </div>

            {/* Record / Status Button */}
            <div>
              {!isRecording ? (
                <GlassButton onClick={startSession} variant="primary">
                  Start Session
                </GlassButton>
              ) : (
                <div className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg border border-green-500/50">
                  Recording Active
                </div>
              )}
            </div>
          </div>

          {/* Zoom-style Meeting Layout */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Mascot (Left) - NEW FROM MAIN */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PNGTuberMascot isPlaying={isSpeaking} />
                </div>
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded">
                  <span className="text-white text-sm font-medium">AI Interviewer</span>
                </div>
              </div>

              {/* Video Preview (Right) - MODIFIED: Uses CameraFeed */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <div className="absolute inset-0 w-full h-full">
                  <CameraFeed />
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full z-10">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Live Feed</span>
                </div>
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded">
                  <span className="text-white text-sm font-medium">You</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Vitals Data (Below Video Grid) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center justify-center backdrop-blur-sm border border-white/5">
              <span className="text-white/60 text-sm mb-1 uppercase tracking-wider">Heart Rate</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${vitals.pulse > 100 ? 'text-red-500' :
                    vitals.pulse >= 60 ? 'text-yellow-400' :
                      'text-green-500'
                  }`}>
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
                <span className={`text-4xl font-bold ${vitals.breathing > 20 ? 'text-red-500' :
                    vitals.breathing >= 12 ? 'text-yellow-400' :
                      'text-green-500'
                  }`}>
                  {vitals.breathing > 0 ? vitals.breathing : '--'}
                </span>
                <span className="text-white/60 text-sm">BPM</span>
              </div>
              <span className="text-xs text-white/40 mt-1">
                {vitals.breathing > 20 ? 'Stress' : vitals.breathing >= 12 ? 'Normal' : 'Deep Relaxation'}
              </span>
            </div>
          </div>

          {/* Dynamic Status / Question Text */}
          <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10 min-h-[100px] flex items-center justify-center text-center">
            <h2 className="text-xl md:text-2xl text-white font-medium">
              {statusText}
            </h2>
          </div>

          {/* Controls */}
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

          {/* Instructions (Bottom) */}
          <div className="mt-8 p-4 bg-white/5 rounded-lg text-center">
            <p className="text-white/70 text-sm">
              <strong>Instructions:</strong> Your interview is being monitored by the Presage Vitals Engine.
            </p>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
