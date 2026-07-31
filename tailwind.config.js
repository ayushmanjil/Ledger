/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        leather: {
          950: '#1F1410',
          900: '#2B1810',
          800: '#3D2417',
          700: '#4A2C1D',
          600: '#5E3823',
          500: '#7A3F26',
          400: '#8F4F2E',
        },
        olive: {
          900: '#2E3320',
          800: '#3A4127',
          700: '#4B5433',
          600: '#5C6640',
          500: '#707B4E',
          400: '#8A9463',
        },
        caramel: { 500: '#B5651D', 400: '#C67A34' },
        tan: { 400: '#C68958', 300: '#D6A275' },
        bronze: { 400: '#A9793C', 300: '#C0925A' },
        copper: { 400: '#C87137' },
        gold: { 300: '#E0B872', 200: '#EAC88A' },
        cream: { 50: '#F5EBDD', 100: '#F8F0E4' },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        emboss: 'inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -3px 6px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)',
        'emboss-sm': 'inset 0 1px 2px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.4)',
        glass: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      backgroundImage: {
        'leather-grad': 'radial-gradient(120% 120% at 20% 0%, #5E3823 0%, #3D2417 55%, #2B1810 100%)',
        'leather-grad-olive': 'radial-gradient(120% 120% at 20% 0%, #5C6640 0%, #3A4127 55%, #2E3320 100%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: { float: 'float 4s ease-in-out infinite' },
    },
  },
  plugins: [],
}
