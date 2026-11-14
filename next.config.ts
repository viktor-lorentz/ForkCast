import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Snapshots are read with fs at runtime, so ship them with the server functions.
  outputFileTracingIncludes: { "/**": ["./data/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
