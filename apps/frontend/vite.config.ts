import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@collabcode/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      host: 'localhost',
      port: 5173,
    },
    fs: {
      // Allow serving files from the monorepo root
      allow: ['../../']
    }
  },
  // Tell Vite to resolve modules from the monorepo root node_modules
  root: '/app/apps/frontend',
  cacheDir: '/app/apps/frontend/.vite'
})