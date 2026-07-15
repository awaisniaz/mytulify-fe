import type { NextConfig } from "next";
import { toolRedirectEntries } from "./src/lib/catalog/canonical-redirects";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return toolRedirectEntries();
  },
};

export default nextConfig;
