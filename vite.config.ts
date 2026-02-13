import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: './',
  publicDir: 'public',
  base: '/website_scanner/',
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    target: 'ES2020',
    outDir: 'dashboard',
    sourcemap: false
  }
})
