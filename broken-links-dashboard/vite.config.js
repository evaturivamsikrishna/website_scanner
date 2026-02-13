import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    base: '/Website_Runner/broken-links-dashboard/',
    server: {
        port: 5173,
        strictPort: false,
        open: true
    },
    build: {
        target: 'ES2020',
        outDir: 'dist',
        sourcemap: false
    }
});
