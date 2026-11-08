import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // The backend has no CORS middleware, so in dev (and preview) the browser talks to
  // same-origin "/api" and Vite forwards it to the real backend.
  const target = env.VITE_DEV_PROXY_TARGET || 'http://localhost:5000'
  const proxy = {
    '/api': { target, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
    '/socket.io': { target, changeOrigin: true, ws: true },
    '/uploads': { target, changeOrigin: true },
  }
  return {
    plugins: [vue(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
    test: { environment: 'jsdom', include: ['tests/**/*.test.js'], restoreMocks: true },
  }
})
