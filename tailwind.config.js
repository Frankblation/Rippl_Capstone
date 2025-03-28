 /** @type {import('tailwindcss').Config} */
const glob = require('glob');

module.exports = {
  content: [
    './app/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
  ],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};

// Debugging: Log the files being scanned
const files = glob.sync('./app/**/*.{js,ts,tsx}');
console.log('Files being scanned by TailwindCSS:', files);
