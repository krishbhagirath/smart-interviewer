'use client';

import { useEffect, useRef, useState } from 'react';

const PNGTuberMascot = ({ isPlaying }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [imageError, setImageError] = useState(false);
  const animationIntervalRef = useRef(null);

  // Frame configuration (supports .png, .svg, .jpg, .gif, etc.)
  const FRAMES = [
    '/mascot/idle.png',
    '/mascot/talk-1.png',
    '/mascot/talk-2.png'
  ];

  // Animation settings - toggle between frames while speaking
  const FRAME_DURATION = 150; // ms per frame toggle (adjust for faster/slower animation)

  useEffect(() => {
    // Preload images
    FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    // Clear any existing animation
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    if (!isPlaying) {
      // Return to idle when not playing
      setCurrentFrame(0);
      return;
    }

    // Start talking animation - alternate between talk frames
    let talkFrame = 1; // Start with talk-1.png

    animationIntervalRef.current = setInterval(() => {
      setCurrentFrame(talkFrame);
      // Toggle between frame 1 (talk-1) and frame 2 (talk-2)
      talkFrame = talkFrame === 1 ? 2 : 1;
    }, FRAME_DURATION);

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="avatar-stage relative w-full h-full flex justify-center items-center">
      {imageError ? (
        <div className="flex flex-col items-center justify-center text-center p-8">
          <div className="text-6xl mb-4">🎭</div>
          <p className="text-white/70 text-sm mb-2">Mascot images not found</p>
          <p className="text-white/50 text-xs">
            Add idle.png, talk-1.png, and talk-2.png to /public/mascot/
          </p>
        </div>
      ) : (
        <img
          src={FRAMES[currentFrame]}
          alt="Interview Mascot"
          className="avatar-img w-full h-full object-cover transition-transform duration-200 ease-out"
          style={{
            filter: 'drop-shadow(0 0 25px rgba(59, 130, 246, 0.6))',
            willChange: 'transform'
          }}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

export default PNGTuberMascot;
