import { cn } from '@/lib/utils';

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = false
}) {
  const variants = {
    default: 'bg-white/10 border-blue-500/30 sapphire-shimmer',
    light: 'bg-white/15 border-blue-400/30',
    dark: 'bg-black/20 border-blue-600/20',
    accent: 'bg-gradient-to-br from-blue-950/40 to-indigo-950/20 border-blue-500/40 sapphire-shimmer',
  };

  const hoverEffect = hover
    ? 'transition-all duration-300 hover:bg-white/15 hover:shadow-glass-lg hover:scale-[1.02]'
    : '';

  return (
    <div
      className={cn(
        variants[variant],
        'backdrop-blur-glass',
        'rounded-glass',
        'border',
        'shadow-glass',
        hoverEffect,
        className
      )}
    >
      {children}
    </div>
  );
}
