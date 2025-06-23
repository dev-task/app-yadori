/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Spotify風ダークテーマカラーパレット
        spotify: {
          black: '#000000',
          dark: '#121212',
          darker: '#0d1117',
          gray: {
            100: '#f7f7f7',
            200: '#e3e3e3',
            300: '#b3b3b3',
            400: '#727272',
            500: '#535353',
            600: '#404040',
            700: '#2a2a2a',
            800: '#181818',
            900: '#121212',
          },
          green: {
            300: '#30e670',
            400: '#1ed760',
            500: '#1db954',
            600: '#1aa34a',
          },
          blue: {
            400: '#2e77d0',
            500: '#1e3a8a',
            600: '#1e40af',
          },
          purple: {
            400: '#8b5cf6',
            500: '#7c3aed',
            600: '#6d28d9',
          },
          red: {
            400: '#ef4444',
            500: '#dc2626',
            600: '#b91c1c',
          },
          yellow: {
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif'
        ],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'spotify': '0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        'spotify-lg': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'spotify-xl': '0 16px 40px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};