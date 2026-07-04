import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/__tests__/**/*.test.ts"],
  },
});
