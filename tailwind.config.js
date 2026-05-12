/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-tvk-blue', 'bg-tvk-green', 'bg-saffron',
    'text-tvk-blue', 'text-tvk-green', 'text-saffron',
    'border-tvk-blue/10', 'border-tvk-green/10', 'border-saffron/10',
    'bg-tvk-blue/5', 'bg-tvk-green/5', 'bg-saffron/5',
    'hover:border-saffron', 'hover:bg-saffron/5', 'ring-saffron/30', 'ring-offset-tvk-blue',
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1a3a6b', dark: '#0d2347', mid: '#1e4a85', light: '#e8edf5' },
        saffron: { DEFAULT: '#f26522', light: '#fff3ec' },
        tvk: { green: '#138808', blue: '#0057a8' }
      },
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
