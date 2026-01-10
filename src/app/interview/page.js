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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
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

  const startRecording = () => {
    if (!stream) return;

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      setRecordedChunks(chunks);
    };

    recorder.start(1000); // Collect data every second
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-${setupData?.interviewType}-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
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

              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full z-10">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Recording</span>
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
          <div className="flex gap-4 justify-center mb-6">
            {!permissionGranted ? (
              <GlassButton
                onClick={startCamera}
                size="large"
                variant="primary"
              >
                Start Camera
              </GlassButton>
            ) : (
              <>
                {!isRecording ? (
                  <GlassButton
                    onClick={startRecording}
                    size="large"
                    variant="primary"
                  >
                    Start Recording
                  </GlassButton>
                ) : (
                  <GlassButton
                    onClick={stopRecording}
                    size="large"
                    className="bg-red-500/30 hover:bg-red-500/40"
                  >
                    Stop Recording
                  </GlassButton>
                )}

                <GlassButton
                  onClick={stopCamera}
                  size="large"
                  variant="secondary"
                >
                  Stop Camera
                </GlassButton>
              </>
            )}
          </div>

          {/* Download Recording */}
          {recordedChunks.length > 0 && !isRecording && (
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Recording Complete</p>
                  <p className="text-white/60 text-sm">Your interview has been recorded</p>
                </div>
                <GlassButton onClick={downloadRecording}>
                  Download Recording
                </GlassButton>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <p className="text-white/70 text-sm">
              <strong>Instructions:</strong> Enable your camera and microphone, then start recording when ready.
              You can download your recording when finished.
            </p>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
