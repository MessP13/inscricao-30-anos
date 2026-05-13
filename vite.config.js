// ✏️  LOG: após qualquer alteração neste ficheiro, execute "npm run logs"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
