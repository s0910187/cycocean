import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.ELECTRON_BUILD ? "./" : "/cycocean/",
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
  },
});
