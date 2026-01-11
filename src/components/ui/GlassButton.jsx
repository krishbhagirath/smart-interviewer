import { cn } from '@/lib/utils';

export default function GlassButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  className = '',
}) {
  const baseStyles = 'glass-effect rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'text-white bg-blue-600/30 hover:bg-blue-500/40 hover:shadow-glass-lg active:scale-95 border-blue-400/50 shadow-blue-500/30',
    secondary: 'text-white/80 hover:text-white hover:bg-white/10',
  };

  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
