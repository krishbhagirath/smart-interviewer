'use client';

import GlassCard from '@/components/ui/GlassCard';

export default function ReportDisplay({ reportData }) {
  const { report, metadata } = reportData;

  // Simple markdown parser for basic formatting
  const renderMarkdown = (text) => {
    return text
      .split('\n')
      .map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={idx} className="text-xl font-bold text-white mt-6 mb-3">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={idx} className="text-2xl font-bold text-white mt-8 mb-4">{line.slice(3)}</h2>;
        }
        // Bullets
        if (line.startsWith('- ')) {
          return <li key={idx} className="text-white/80 ml-4">{line.slice(2)}</li>;
        }
        // Bold
        const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Paragraphs
        return line.trim() ? <p key={idx} className="text-white/70 mb-2" dangerouslySetInnerHTML={{ __html: boldText }} /> : <br key={idx} />;
      });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard variant="accent">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Interview Feedback Report</h1>
          <div className="flex gap-4 text-sm text-white/60">
            <span>Questions: {metadata.questionsAnalyzed}/5</span>
            <span>•</span>
            <span>Generated: {new Date(metadata.generatedAt).toLocaleString()}</span>
          </div>
        </div>
      </GlassCard>

      {/* Report Content */}
      <GlassCard>
        <div className="p-8 prose prose-invert max-w-none">
          {renderMarkdown(report)}
        </div>
      </GlassCard>
    </div>
  );
}
