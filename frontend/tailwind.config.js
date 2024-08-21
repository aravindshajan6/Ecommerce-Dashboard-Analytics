/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html', // Include HTML files
    './src/**/*.{js,jsx,ts,tsx}', 
    './components/**/*.{js,jsx,ts,tsx}'// Include all JS, JSX, TS, TSX files in src directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
