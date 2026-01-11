import { useEffect, useRef, useState } from 'react';

const AudioVisualizer = ({ stream, isListening }) => {
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);

    // Volume state (0 to 100)
    const [volume, setVolume] = useState(0);

    useEffect(() => {
        if (!stream) {
            setVolume(0);
            return;
        }

        let audioContext;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error("AudioContext support error", e);
            return;
        }

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        let source;
        try {
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
        } catch (e) {
            console.error("Source creation error", e);
            return;
        }

        sourceRef.current = source;
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
            // If not marked as listening (e.g. agent speaking or processing), drop vol to 0 or low hum
            if (!isListening) {
                setVolume(prev => prev * 0.9); // fade out
                if (volume > 0.1) animationRef.current = requestAnimationFrame(updateVolume);
                return;
            }

            analyser.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Sensitivity scaling
            // Average usually 0-100ish for speech.
            // We want to hit 100% when loud.
            const normalized = Math.min(100, Math.max(0, (average - 10) * 3));

            setVolume(prev => {
                const diff = normalized - prev;
                return prev + (diff * 0.3); // Smooth smoothing
            });

            animationRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch (e) { }
            }
            if (audioContext && audioContext.state !== 'closed') audioContext.close();
        };
    }, [stream, isListening]);

    return (
        <div className="w-full h-full flex items-center justify-center pointer-events-none select-none">
            <div className="relative w-10 h-14 md:w-16 md:h-24">

                {/* 1. Base Outline/Inactive State (Faint white) */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="absolute inset-0 w-full h-full text-white/20"
                >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>

                {/* 2. Active State (Solid White) - Clipped by Volume */}
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    className="absolute inset-0 w-full h-full text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-[clip-path] duration-75"
                    style={{
                        clipPath: `inset(${100 - volume}% 0 0 0)`
                    }}
                >
                    {/* Full fill for the body */}
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />

                    {/* Strokes for the stand need to be 'filled' or treated as strokes? 
                    If we use fill="currentColor", paths act as shapes. 
                    Lines must be strokes. 
                */}
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>

                {/* Glow effect just for fun */}
                <div
                    className="absolute inset-0 bg-white/10 rounded-full blur-xl transition-opacity duration-100"
                    style={{ opacity: volume > 30 ? (volume / 100) : 0 }}
                />
            </div>
        </div>
    );
};

export default AudioVisualizer;
