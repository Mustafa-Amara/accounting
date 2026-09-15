import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts}"],
  theme: {
    extend: {
      fontFamily: { cairo: ["Cairo", "Tajawal", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
