'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import ReactMarkdown from 'react-markdown';

function ReportContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('sessionId');

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRan = useRef(false);

    useEffect(() => {
        if (!sessionId) {
            setError('No Session ID provided.');
            setLoading(false);
            return;
        }

        if (fetchRan.current) return;
        fetchRan.current = true;

        const fetchReport = async () => {
            try {
                const res = await fetch('/api/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to generate report');

                setReport(data.report);
            } catch (err) {
                setError(err.message);
                // Allow retrying if it failed (optional, but good for UX if transient)
                fetchRan.current = false;
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
                <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xl animate-pulse">Generating your personalized analysis...</p>
                <p className="text-sm text-white/50 mt-2">This may take a few seconds.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 text-white">
                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                <p className="text-white/70 mb-6">{error}</p>
                <GlassButton onClick={() => router.push('/')}>Return Home</GlassButton>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
            </div>

            <div className="flex justify-center pt-8 border-t border-white/10">
                <GlassButton onClick={() => router.push('/')} variant="primary">
                    Start New Session
                </GlassButton>
            </div>
        </div>
    );
}

export default function ReportPage() {
    return (
        <main className="min-h-screen p-4 md:p-8">
            <GradientBackground />
            <div className="max-w-4xl mx-auto">
                <GlassCard className="p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center border-b border-white/10 pb-6">
                        Interview Analysis
                    </h1>
                    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
                        <ReportContent />
                    </Suspense>
                </GlassCard>
            </div>
        </main>
    );
}
