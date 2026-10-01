import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  typedRoutes: true,
  poweredByHeader: false,
  // O indicador do ambiente local sobrepunha o cartão de conta no rodapé.
  devIndicators: false,
};

export default nextConfig;
