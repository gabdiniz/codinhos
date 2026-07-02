import path from 'node:path'
import type { NextConfig } from 'next'

// `output: 'standalone'` só no build do Docker (BUILD_STANDALONE=true).
// Localmente fica desligado para o `next start` funcionar (ex.: medir com Lighthouse).
const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  outputFileTracingRoot: path.join(__dirname, '../../'),
}

export default nextConfig
