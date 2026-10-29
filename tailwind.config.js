/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        monochromatic: {
          1: "#1A1A1A",
          2: "#333333",
          3: "#4D4D4D",
          4: "#666666",
          5: "#808080",
          6: "#999999",
          7: "#B3B3B3",
          8: "#CCCCCC",
          9: "#F2F2F2",
          10: "#FFFFFF",
        },
        brand: {
          1: "#111111",
          2: "#222222",
          3: "#333333",
          4: "#444444",
          5: "#555555",
          6: "#777777",
          7: "#999999",
          8: "#BBBBBB",
          9: "#DDDDDD",
          10: "#F7F7F7",
        },
        validation: {
          neutral: "#555555",
          success: "#333333",
          warning: "#666666",
          error: "#111111",
        },
        font: {
          dark: "#0F0F0F",
          mid: "rgba(15, 15, 15, 0.6)",
          light: "rgba(15, 15, 15, 0.3)",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["Poppins_400Regular"],
        body: ["Inter_400Regular"],
        gothic: ["Inter_400Regular"],
      },
      fontSize: {
        "heading-1": ["26px", { lineHeight: "32px", fontWeight: "600" }],
        "heading-2": ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "heading-3": ["20px", { lineHeight: "24px", fontWeight: "600" }],
        "heading-4": ["19px", { lineHeight: "24px", fontWeight: "600" }],
        "heading-5": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "heading-6": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "paragraph-lg": ["16px", { lineHeight: "24px" }],
        "paragraph-sm": ["14px", { lineHeight: "20px" }],
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        8: "32px",
      },
      borderRadius: {
        component: "8px",
        card: "24px",
      },
      boxShadow: {
        "outer-default": "0 0 24px 0 rgba(180, 188, 203, 0.24)",
      },
    },
  },
  plugins: [],
};
