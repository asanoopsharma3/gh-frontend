import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/admin-api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})
