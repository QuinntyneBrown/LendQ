/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6B6B",
          light: "#FFF1F0",
          hover: "#FF5252",
        },
        surface: "#FFFFFF",
        background: "#F6F7F8",
        "background-alt": "#F9FAFB",
        border: {
          DEFAULT: "#F3F4F6",
          strong: "#E5E7EB",
        },
        "text-primary": "#1A1A1A",
        "text-secondary": "#6B7280",
        "text-muted": "#9CA3AF",
        success: {
          DEFAULT: "#DCFCE7",
          text: "#16A34A",
          dot: "#22C55E",
        },
        danger: {
          DEFAULT: "#FEE2E2",
          text: "#DC2626",
        },
        warning: {
          DEFAULT: "#FFFBEB",
          text: "#D97706",
          dot: "#FCD34D",
        },
        info: {
          DEFAULT: "#F0F5FF",
          text: "#6366F1",
        },
        "unread-bg": "#FFF8F7",
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', "sans-serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
      borderRadius: {
        button: "12px",
        input: "12px",
        badge: "12px",
        card: "16px",
        modal: "20px",
      },
      boxShadow: {
        modal: "0 8px 32px rgba(0, 0, 0, 0.1)",
        toast: "0 4px 12px rgba(0, 0, 0, 0.05)",
      },
      screens: {
        tablet: "768px",
        desktop: "1280px",
      },
    },
  },
  plugins: [],
};
