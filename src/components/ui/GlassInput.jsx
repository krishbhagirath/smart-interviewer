import { cn } from '@/lib/utils';

export default function GlassInput({
  label,
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  type = 'text',
  className = '',
}) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-white/90 text-sm font-medium mb-2">
          {label}
          {required && <span className="text-pink-400 ml-1">*</span>}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          'w-full px-4 py-3 rounded-lg',
          'glass-effect',
          'text-white placeholder-white/50',
          'focus:outline-none focus:ring-2 focus:ring-white/50',
          'transition-all duration-300',
          error && 'ring-2 ring-pink-400',
        )}
      />

      {error && (
        <p className="mt-1 text-sm text-pink-400">{error}</p>
      )}
    </div>
  );
}
