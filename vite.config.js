import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, because Nebari serves the app under /user/NAME/APP/.
  base: './',
  // During `npm run dev`, send API calls to `node server.js 3001`.
  server: { proxy: { '/api': 'http://localhost:3001' } },
})
