import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/pages/api/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
