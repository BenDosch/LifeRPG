/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        border: '#1e1e2e',
        accent: '#7c3aed',
        'accent-light': '#a855f7',
        text: '#e2e8f0',
        muted: '#64748b',
        easy: '#ADFF2F',
        medium: '#FFD700',
        hard: '#FF6347',
        xp: '#7c3aed',
        momentum: '#06b6d4',
      },
      fontFamily: {
        electrolize: ['Electrolize-Regular'],
      },
    },
  },
  plugins: [],
};
