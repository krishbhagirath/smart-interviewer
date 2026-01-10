/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.15)',
          dark: 'rgba(0, 0, 0, 0.2)',
          border: 'rgba(255, 255, 255, 0.2)',
        },
        gradient: {
          start: '#1e293b',
          middle: '#334155',
          end: '#374151',
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        'glass-heavy': '24px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-lg': '0 12px 48px 0 rgba(31, 38, 135, 0.45)',
        'glass-inner': 'inset 0 0 20px rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        glass: '16px',
        'glass-lg': '24px',
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)'
          },
          '50%': {
            transform: 'translateY(-20px)'
          },
        },
        'glow': {
          '0%': {
            'box-shadow': '0 0 20px rgba(102, 126, 234, 0.5)'
          },
          '100%': {
            'box-shadow': '0 0 40px rgba(102, 126, 234, 0.8)'
          },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.animation-delay-2000': {
          'animation-delay': '2s',
        },
        '.animation-delay-4000': {
          'animation-delay': '4s',
        },
      });
    },
  ],
}
