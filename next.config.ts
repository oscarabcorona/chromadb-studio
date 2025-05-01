import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["chromadb"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace native modules with empty modules on client-side
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        "chromadb-default-embed": false,
        "node-fetch": false,
        encoding: false,
        fs: false,
        net: false,
      };
    } else {
      // Externalize node modules on server-side
      config.externals = [
        ...(config.externals || []),
        "onnxruntime-node",
        "chromadb-default-embed",
      ];
    }

    return config;
  },
};

export default nextConfig;
