import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#e0e0e0",
        border: "#333333",
        accent: "#0F9946",
        logoGreen: "#0F9946",
        logoGreenDark: "#09682E",
        logoLime: "#70C12A",
        logoOrange: "#F7941D",
        logoYellow: "#FFDE00",
        error: "#ff5555",
        success: "#70C12A",
      },
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
