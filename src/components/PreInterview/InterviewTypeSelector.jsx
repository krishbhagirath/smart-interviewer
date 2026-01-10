import GlassDropdown from '@/components/ui/GlassDropdown';
import { INTERVIEW_TYPES } from '@/lib/constants';

export default function InterviewTypeSelector({ value, onChange, error }) {
  const selectedType = INTERVIEW_TYPES.find(type => type.id === value);

  return (
    <div className="space-y-2">
      <GlassDropdown
        label="Interview Type"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={INTERVIEW_TYPES}
        placeholder="Select interview type"
        error={error}
        required
      />

      {selectedType && (
        <p className="text-white/70 text-sm ml-1">
          {selectedType.description}
        </p>
      )}
    </div>
  );
}
