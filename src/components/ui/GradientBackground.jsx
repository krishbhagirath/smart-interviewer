export default function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-900">
      <div className="gradient-bg absolute inset-0" />

      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-slate-700/20 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
      <div className="absolute top-40 right-20 w-96 h-96 bg-gray-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000" />
      <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-zinc-700/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-4000" />
    </div>
  );
}
