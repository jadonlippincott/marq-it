/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // MarqIt fertility-reading palette — refine in the UI tickets (MI-14/15).
        reading: {
          low: "#16a34a", // green
          high: "#eab308", // amber
          peak: "#dc2626", // red
        },
      },
    },
  },
  plugins: [],
};
