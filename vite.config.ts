import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/designer-pathways-app/',
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    include: ['react-is', 'recharts'],
  },
})
