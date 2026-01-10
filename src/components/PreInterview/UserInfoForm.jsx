import GlassDropdown from '@/components/ui/GlassDropdown';
import { EXPERIENCE_LEVELS } from '@/lib/constants';

export default function UserInfoForm({
  experienceLevel,
  onExperienceLevelChange,
  errors
}) {
  return (
    <div>
      <GlassDropdown
        label="Experience Level"
        value={experienceLevel}
        onChange={(e) => onExperienceLevelChange(e.target.value)}
        options={EXPERIENCE_LEVELS}
        placeholder="Select your experience level"
        error={errors.experienceLevel}
        required
      />
    </div>
  );
}
