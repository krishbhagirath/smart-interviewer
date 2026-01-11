'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import ReportDisplay from '@/components/Results/ReportDisplay';
import LoadingSpinner from '@/components/Results/LoadingSpinner';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [state, setState] = useState('loading'); // loading | success | error
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }
    fetchReport();
  }, [sessionId]);

  const fetchReport = async () => {
    try {
      setState('loading');

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReportData(data);
      setState('success');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GradientBackground />

      <div className="w-full max-w-4xl">
        {state === 'loading' && (
          <GlassCard className="p-8">
            <LoadingSpinner />
          </GlassCard>
        )}

        {state === 'error' && (
          <GlassCard className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-4">Report Generation Failed</h2>
              <p className="text-white/70 mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <GlassButton onClick={fetchReport} variant="primary">
                  Try Again
                </GlassButton>
                <GlassButton onClick={() => router.push('/')} variant="secondary">
                  Back to Home
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        )}

        {state === 'success' && (
          <>
            <ReportDisplay reportData={reportData} />

            <div className="mt-6 flex gap-4 justify-center">
              <GlassButton onClick={() => router.push('/')} variant="primary" size="large">
                Practice Again
              </GlassButton>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
