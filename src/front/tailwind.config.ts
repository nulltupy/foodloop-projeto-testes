import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        ink: {
          500: '#6b7280',
          700: '#374151',
          900: '#111827',
        },
        surface: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
        },
      },
    },
  },
  plugins: [],
};

export default config;
