import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next does not infer it from a
  // stray lockfile in a parent directory.
  turbopack: {
    root: import.meta.dirname,
  },
  // better-sqlite3 is a native addon; it (and the Prisma adapter wrapping it)
  // must stay external to the server bundle instead of being bundled.
  serverExternalPackages: ["@prisma/adapter-better-sqlite3", "better-sqlite3"],
};

export default nextConfig;
