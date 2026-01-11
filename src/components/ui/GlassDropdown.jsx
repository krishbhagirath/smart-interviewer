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
        <label className="block text-slate-700 text-sm font-semibold mb-2">
          {label}
          {required && <span className="text-blue-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          className={cn(
            'w-full px-4 py-3.5 rounded-xl',
            'bg-slate-50 border border-slate-200',
            'text-slate-900 font-medium',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'transition-all duration-200',
            'cursor-pointer',
            'appearance-none',
            error && 'border-red-400 ring-4 ring-red-500/10',
            !value && 'text-slate-400',
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.id}
              value={option.id}
              className="text-slate-900 py-2"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom Arrow Icon */}
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
