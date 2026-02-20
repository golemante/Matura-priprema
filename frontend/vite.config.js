import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url"; // Dodaj ovo
import path from "path";

const __filename = fileURLToPath(import.meta.url); // Dodaj ovo
const __dirname = path.dirname(__filename); // Dodaj ovo

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
