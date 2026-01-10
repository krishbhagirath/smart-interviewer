'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

export default function InterviewPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => {
    const data = localStorage.getItem('interviewSetup');

    if (!data) {
      router.push('/');
      return;
    }

    setSetupData(JSON.parse(data));
  }, [router]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
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
      setError('Failed to access camera/microphone. Please grant permissions and try again.');
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
    return () => {
      stopCamera();
    };
  }, []);

  if (!setupData) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GradientBackground />

      <div className="w-full max-w-4xl">
        <GlassCard className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Interview Session
            </h1>
            <div className="flex gap-4 text-sm text-white/70">
              <span><strong>Type:</strong> {setupData.interviewType}</span>
              <span><strong>Level:</strong> {setupData.experienceLevel}</span>
            </div>
          </div>

          {/* Video Preview */}
          <div className="mb-6">
            <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ paddingTop: '56.25%' }}>
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
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full z-10">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Processing</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          {permissionGranted && (
            <div className="flex gap-4 justify-center mb-6">
              <GlassButton
                onClick={stopCamera}
                size="large"
                variant="secondary"
              >
                Stop Video
              </GlassButton>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-white/70 text-sm">
              <strong>Instructions:</strong> Enable your camera and microphone to begin.
              Your video and audio will be processed for the interview.
            </p>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
