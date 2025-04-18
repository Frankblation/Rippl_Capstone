/** @type {import('tailwindcss').Config} */
const glob = require('glob');

module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Subjectivity Bold"', 'sans-serif'],
        body: ['"SF Pro Text"', 'sans-serif'],
      },
      colors: {
        atlantis: '#00AF9F',
      },
    },
    plugins: [],
  },
};

// Debugging: Log the files being scanned
const files = glob.sync('./app/**/*.{js,ts,tsx}');
console.log('Files being scanned by TailwindCSS:', files);
