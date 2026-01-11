export default function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-blue-500/30 rounded-full animate-spin"
             style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 w-24 h-24 border-4 border-blue-400 rounded-full animate-ping opacity-20" />
      </div>
      <p className="mt-6 text-white/70 text-lg animate-pulse">
        {message || "Generating your feedback report..."}
      </p>
      <p className="mt-2 text-white/50 text-sm">This may take 5-10 seconds</p>
    </div>
  );
}
