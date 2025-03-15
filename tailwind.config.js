/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'loader-dot1': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
        },
        'loader-dot2': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
          '0%, 15%': { transform: 'scale(1)', opacity: '1' }, 
        },
        'loader-dot3': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
          '0%, 30%': { transform: 'scale(1)', opacity: '1' }, 
        },
        'loader-bounce1': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'loader-bounce2': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '0%, 10%': { transform: 'translateY(0)' }
        },
        'loader-bounce3': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '0%, 20%': { transform: 'translateY(0)' }
        },
        'loader-bar': {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' }
        }
      },
      animation: {
        'loader-dot1': 'loader-dot1 1.4s infinite ease-in-out',
        'loader-dot2': 'loader-dot2 1.4s infinite ease-in-out 0.2s',
        'loader-dot3': 'loader-dot3 1.4s infinite ease-in-out 0.4s',
        'loader-bounce1': 'loader-bounce1 1.2s infinite',
        'loader-bounce2': 'loader-bounce2 1.2s infinite 0.2s',
        'loader-bounce3': 'loader-bounce3 1.2s infinite 0.4s',
        'loader-bar': 'loader-bar 2s infinite ease-in-out'
      },
    },
  },
  plugins: [],
}