import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        clk: {
          dark: "#0D1117",
          red: "#C00000",
          green: "#375623",
          yellow: "#B8860B",
          bg: "#F6F9FE",
          text: "#111111",
          "gray-light": "#E5E7EB",
          "gray-medium": "#CCD1D3",
          "card-border": "#E5E7EB",
        },
      },
      fontFamily: {
        lato: ["Lato", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
