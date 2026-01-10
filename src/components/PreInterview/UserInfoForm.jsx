import GlassInput from '@/components/ui/GlassInput';
import GlassDropdown from '@/components/ui/GlassDropdown';
import { EXPERIENCE_LEVELS } from '@/lib/constants';

export default function UserInfoForm({
  role,
  experienceLevel,
  onRoleChange,
  onExperienceLevelChange,
  errors
}) {
  return (
    <div className="space-y-4">
      <GlassInput
        label="Target Role/Position"
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        placeholder="e.g., Senior Frontend Engineer"
        error={errors.role}
        required
      />

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
