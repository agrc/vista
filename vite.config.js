import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import packageJson from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom" },
  define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
});
