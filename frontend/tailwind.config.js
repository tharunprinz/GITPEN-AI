/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#080710',
        darkCard: 'rgba(20, 20, 35, 0.45)',
        accentCyan: '#06b6d4',
        accentIndigo: '#6366f1',
        vulnCritical: '#ef4444',
        vulnHigh: '#f97316',
        vulnMedium: '#eab308',
        vulnLow: '#3b82f6',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        neonCyan: '0 0 15px rgba(6, 182, 212, 0.45)',
        neonIndigo: '0 0 15px rgba(99, 102, 241, 0.45)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
