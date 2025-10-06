export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"], // Added global Poppins font
      },
      backgroundImage: {
        "login-light": "url('/images/keyboard-tea-cup-apple-office-stationeries-black-background.jpg')",
        "login-dark": "url('/images/login-dark.jpg')",
      },
    },
  },
  plugins: [],
}
