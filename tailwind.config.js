/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#faf9f7",
        line: "#ede9e3",
        "line-strong": "#e7e2dc",
        ink: "#111214",
        muted: "#6b7280",
        "muted-2": "#9aa0a8",
        accent: "#1a6b4a",
        "accent-soft": "#edf4ef",
        charcoal: "#131517",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04)",
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.04)",
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
      },
    },
  },
  plugins: [],
}
