import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allows external access
    port: 5173, // You can change this if needed
    proxy: {
      '/api/vitals': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        secure: false, // Sometimes helpful for https targets
        rewrite: () => '/spreadsheets/d/1moJ6MTDPs5JY3Uyut-rkCIRqDYJzjqMHxsZJKh28kvk/export?format=xlsx'
      }
    }
  }
})
