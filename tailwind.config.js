/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12151C",
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        sidebar: "#0B0E14",
        sidebarhover: "#171B26",
        sidebarline: "#232838",
        muted: "#6B7280",
        border: "#E4E7EC",
        primary: {
          DEFAULT: "#3654FF",
          dark: "#2540DB",
          light: "#EEF1FF",
        },
        amber: {
          DEFAULT: "#FF8A3D",
          light: "#FFF1E6",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#EAF9EF",
        },
        danger: {
          DEFAULT: "#E5484D",
          light: "#FDEEEE",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(18, 21, 28, 0.04), 0 1px 6px rgba(18, 21, 28, 0.03)",
        pop: "0 8px 24px rgba(18, 21, 28, 0.12)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
}
