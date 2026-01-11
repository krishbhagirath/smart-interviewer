'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Removed Legacy Dark Mode Components
// import GradientBackground from '@/components/ui/GradientBackground';
// import GlassCard from '@/components/ui/GlassCard';
import InterviewTypeSelector from '@/components/PreInterview/InterviewTypeSelector';
import UserInfoForm from '@/components/PreInterview/UserInfoForm';
import { validatePreInterviewForm } from '@/lib/utils';
import { motion } from 'framer-motion';
import CompanyTicker from '@/components/ui/CompanyTicker';

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
    localStorage.setItem('interviewSetup', JSON.stringify(formData));
    router.push('/interview');
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[80px] opacity-50 pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/30 overflow-hidden">
            {/* Mini Robot Logo */}
            <span className="text-2xl">🤖</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Hiready</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-blue-600 transition-colors">How it works</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
          <a href="#" className="text-blue-600 hover:text-blue-700">Login</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20 pt-8 lg:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">

          {/* Left: Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-semibold mb-6 shadow-sm">
              ✨ #1 AI Interview Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Ace your next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                Job Interview.
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
              Hiready provides real-time feedback on your answers, communication style, and stress levels. Practice with an AI recruiter that adapts to your responses.
            </p>

            <div className="flex gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                    User
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
                  +2k
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-bold text-slate-900">Used by 2,000+ engineers</span>
                <span className="text-xs text-slate-500">to land jobs at top companies</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Setup Card (Prepify Style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-white/50 relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-3xl" />

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Start a New Session</h2>
              <p className="text-slate-500 mb-8">Configure your AI interviewer settings below.</p>

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

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-xl shadow-blue-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-4"
                >
                  Start Interview
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Ticker Section */}
      <CompanyTicker />

    </main>
  );
}
