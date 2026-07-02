import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Build enxuto para container de produção (copia só o necessário).
  output: 'standalone',
  // Em monorepo, traça as dependências a partir da raiz do workspace.
  outputFileTracingRoot: path.join(__dirname, '../../'),
}

export default nextConfig
