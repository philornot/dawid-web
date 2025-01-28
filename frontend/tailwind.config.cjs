/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient-flow': 'gradientFlow 25s ease infinite',
        'message-entrance': 'messageEntrance 0.5s ease-out',
        'fog-pulse': 'fogPulse 8s ease-in-out infinite',
        'hue-rotate': 'hueRotate 15s linear infinite'
      },
      keyframes: {
        gradientFlow: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        messageEntrance: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fogPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
          '50%': { transform: 'scale(1.1)', opacity: 0.8 },
        },
        hueRotate: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        }
      },
      backgroundImage: {
        'gradient-flow': 'linear-gradient(135deg, #301367, #8a64e8, #c293ff, #8a64e8, #301367)',
      },
      zIndex: {
        '10': '10',
        '20': '20',
      }
    },
  },
  plugins: [],
}