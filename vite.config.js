import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Security headers such as CSP/HSTS must be configured by the production
  // web server/CDN because Vite is only the build tool.
});
