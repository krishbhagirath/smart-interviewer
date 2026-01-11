'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import Logo from '@/components/shared/Logo';
import InstructionsPanel from '@/components/PreInterview/InstructionsPanel';
import InterviewTypeSelector from '@/components/PreInterview/InterviewTypeSelector';
import UserInfoForm from '@/components/PreInterview/UserInfoForm';
import { validatePreInterviewForm } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    interviewType: '',
    experienceLevel: '',
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = validatePreInterviewForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Store data in localStorage
    localStorage.setItem('interviewSetup', JSON.stringify(formData));

    // Navigate to interview page
    router.push('/interview');
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <GradientBackground />

      <div className="w-full max-w-2xl">
        <Logo />

        <InstructionsPanel />

        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <InterviewTypeSelector
              value={formData.interviewType}
              onChange={(value) => updateFormData('interviewType', value)}
              error={errors.interviewType}
            />

            <UserInfoForm
              experienceLevel={formData.experienceLevel}
              onExperienceLevelChange={(value) => updateFormData('experienceLevel', value)}
              errors={errors}
            />

            <GlassButton
              type="submit"
              variant="primary"
              size="large"
              className="w-full mt-8"
            >
              Start Interview →
            </GlassButton>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
