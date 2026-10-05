import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const nextConfig: NextConfig = {
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  typedRoutes: true,
  poweredByHeader: false,
  // O indicador do ambiente local sobrepunha o cartão de conta no rodapé.
  devIndicators: false,
};

export default nextConfig;
