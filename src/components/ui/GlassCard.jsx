import { cn } from '@/lib/utils';

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = false
}) {
  const variants = {
    default: 'bg-white/10 border-white/20',
    light: 'bg-white/15 border-white/30',
    dark: 'bg-black/20 border-white/10',
    accent: 'bg-gradient-to-br from-white/10 to-white/5 border-white/20',
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
