import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Load .env (DATABASE_URL) the way Next does at runtime; vitest doesn't on
    // its own, so the Prisma adapter would otherwise get an undefined url.
    setupFiles: ["dotenv/config"],
    // Integration tests share the one SQLite dev.db; run files serially so
    // concurrent writers don't hit SQLite lock timeouts.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
