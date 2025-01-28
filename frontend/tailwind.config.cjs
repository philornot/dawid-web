/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient-flow': 'gradientFlow 15s ease infinite',
        'fog': 'fogMovement 25s linear infinite',
        'message-entrance': 'messageEntrance 0.5s ease-out',
      },
      keyframes: {
        gradientFlow: {
          '0%, 100%': { 
            'background-position': '0% 50%' 
          },
          '50%': { 
            'background-position': '100% 50%' 
          },
        },
        fogMovement: {
          '0%': { 
            transform: 'translate(0,0) rotate(0deg)' 
          },
          '100%': { 
            transform: 'translate(100vw,50vh) rotate(360deg)' 
          },
        },
        messageEntrance: {
          '0%': { 
            opacity: 0, 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: 1, 
            transform: 'translateY(0)' 
          },
        },
      },
      backgroundImage: {
        'gradient-flow': 'linear-gradient(135deg, #301367, #8a64e8, #c293ff, #8a64e8, #301367)',
      },
    },
  },
  plugins: [],
}