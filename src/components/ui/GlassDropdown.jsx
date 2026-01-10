import { cn } from '@/lib/utils';

export default function GlassDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  required = false,
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

      <select
        value={value}
        onChange={onChange}
        required={required}
        className={cn(
          'w-full px-4 py-3 rounded-lg',
          'glass-effect',
          'text-white',
          'focus:outline-none focus:ring-2 focus:ring-white/50',
          'transition-all duration-300',
          'cursor-pointer',
          'appearance-none bg-no-repeat bg-right',
          error && 'ring-2 ring-pink-400',
          !value && 'text-white/50',
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
            className="bg-gray-800 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-sm text-pink-400">{error}</p>
      )}
    </div>
  );
}
