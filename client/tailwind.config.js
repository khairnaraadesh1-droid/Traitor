/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blood: {
          DEFAULT: "#dc2626",
          glow: "#ef4444",
          dark: "#991b1b",
        },
        void: {
          DEFAULT: "#0a0a0a",
          card: "#111111",
          border: "#1f1f1f",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(220, 38, 38, 0.5), 0 0 40px rgba(220, 38, 38, 0.2)",
        "neon-sm": "0 0 10px rgba(220, 38, 38, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        fog: "fog 20s ease-in-out infinite",
      },
      keyframes: {
        fog: {
          "0%, 100%": { opacity: "0.3", transform: "translateX(0)" },
          "50%": { opacity: "0.6", transform: "translateX(-20px)" },
        },
      },
    },
  },
  plugins: [],
};
