/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts}',
    './lib/**/*.{js,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Extend with CyberLab brand accent
        cyberlab: {
          50  : '#ecfdf5',
          100 : '#d1fae5',
          400 : '#34d399',
          500 : '#10b981',
          600 : '#059669',
          900 : '#064e3b',
          950 : '#022c22',
        },
      },
      animation: {
        'slide-in-right' : 'slideInRight 0.3s ease-out forwards',
        'fade-in-up'     : 'fadeInUp 0.4s ease-out forwards',
        'shimmer'        : 'shimmer 1.5s infinite',
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(rgba(16,185,129,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.03) 1px,transparent 1px)",
      },
      backgroundSize: {
        'cyber-grid': '64px 64px',
      },
    },
  },
  plugins: [],
};
