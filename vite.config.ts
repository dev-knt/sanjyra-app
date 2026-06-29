import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from a project subpath on GitHub Pages (dev-knt.github.io/sanjyra-app/)
  base: '/sanjyra-app/',
  plugins: [react()],
})
