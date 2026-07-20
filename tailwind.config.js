/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          DEFAULT: '#4E1F91',
          light: '#7B3FBF',
          glow: 'rgba(78, 31, 145, 0.4)',
        },
        orange: {
          DEFAULT: '#FF7300',
          light: '#FF9A44',
          glow: 'rgba(255, 115, 0, 0.35)',
        },
        bg: {
          primary: '#05030A',
          secondary: '#0B0815',
          card: 'rgba(23, 16, 33, 0.7)',
          hover: 'rgba(35, 25, 50, 0.85)',
        },
        text: {
          primary: '#F0EDF5',
          secondary: '#B8B0C9',
          muted: '#7A728F',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
        },
        green: {
          DEFAULT: '#2ECC71',
        },
        red: {
          DEFAULT: '#E74C3C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 60px rgba(0, 0, 0, 0.7)',
        glow: '0 0 80px rgba(78, 31, 145, 0.08)',
        orange: '0 8px 32px rgba(255, 115, 0, 0.35)',
      },
      borderRadius: {
        'lg': '28px',
        'md': '16px',
        'sm': '10px',
      },
    },
  },
  plugins: [],
}
