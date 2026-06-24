/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // MarqIt fertility-reading palette — refine in the UI tickets (MI-14/15).
        reading: {
          low: "#a855f7", // soft purple
          high: "#c8a2c8", // lilac
          peak: "#f97316", // orange
        },
      },
    },
  },
  plugins: [],
};
