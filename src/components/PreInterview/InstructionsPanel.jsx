import GlassCard from '@/components/ui/GlassCard';
import { INSTRUCTIONS } from '@/lib/constants';

export default function InstructionsPanel() {
  return (
    <GlassCard className="p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">
        Welcome to Smart Interviewer
      </h2>

      <p className="text-white/80 mb-4">
        Prepare for your next interview with AI-powered practice sessions.
        Here&apos;s how it works:
      </p>

      <div className="space-y-3">
        {INSTRUCTIONS.map((instruction, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">{instruction.icon}</span>
            <p className="text-white/90 pt-1">{instruction.text}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
