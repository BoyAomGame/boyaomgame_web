import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/userlooker/',
  plugins: [react()],
  build: {
    outDir: '../../../root/userlooker',
    emptyOutDir: true
  }
})
