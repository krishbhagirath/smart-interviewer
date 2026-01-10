'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';

export default function InterviewPage() {
  const router = useRouter();
  const [setupData, setSetupData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('interviewSetup');

    if (!data) {
      router.push('/');
      return;
    }

    setSetupData(JSON.parse(data));
  }, [router]);

  if (!setupData) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GradientBackground />

      <GlassCard className="p-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-4">
          Interview Session
        </h1>

        <div className="space-y-2 text-white/80">
          <p><strong>Interview Type:</strong> {setupData.interviewType}</p>
          <p><strong>Target Role:</strong> {setupData.role}</p>
          <p><strong>Experience Level:</strong> {setupData.experienceLevel}</p>
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <p className="text-white/70">
            🚧 Interview session functionality coming soon...
          </p>
          <p className="text-white/60 text-sm mt-2">
            This will include video/audio recording and question display.
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
