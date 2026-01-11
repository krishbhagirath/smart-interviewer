'use client';

import { useEffect, useState } from 'react';

export default function GradientBackground() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate particles on client side only to avoid hydration mismatch
    const generatedParticles = [...Array(12)].map((_, i) => ({
      id: i,
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      left: Math.random() * 100,
      animationDelay: Math.random() * 8,
      animationDuration: Math.random() * 6 + 8
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      <div className="gradient-bg absolute inset-0" />

      {/* Floating gradient orbs - Sapphire theme */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-3xl animate-float" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-600/25 rounded-full mix-blend-screen filter blur-3xl animate-float animation-delay-2000" />
      <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl animate-float animation-delay-4000" />

      {/* Animated particles */}
      <div className="particles absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              bottom: '-20px',
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}
      </div>

      {/* Pulse rings */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 pulse-ring" style={{ animationDelay: '0s' }} />
      <div className="absolute top-1/3 right-1/3 w-40 h-40 pulse-ring" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/4 left-1/2 w-36 h-36 pulse-ring" style={{ animationDelay: '1s' }} />
    </div>
  );
}
