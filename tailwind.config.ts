import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171F",
        surface: "#1B1F29",
        accent: "#3D5AFE",
        warm: "#FF7A45",
        safe: "#34D399",
        stop: "#F2545B",
      },
    },
  },
  plugins: [],
};
export default config;
