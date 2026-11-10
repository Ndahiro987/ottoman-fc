/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          primary: "#B51226",
          dark: "#8F0E1C",
          light: "#E84A5A",
        },
        charcoal: {
          DEFAULT: "#171717",
          light: "#2A2A2A",
        },
        bg: {
          light: "#F5F5F5",
        },
        gray: {
          secondary: "#777777",
          light: "#E5E5E5",
        },
        white: "#FFFFFF",
        success: "#15803d",
        warning: "#B45309",
        danger: "#B51226",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Arial", "Helvetica", "sans-serif"],
      },
      borderRadius: {
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
    },
  },
  plugins: [],
};
