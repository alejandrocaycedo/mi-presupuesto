import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mi-presupuesto/', // Esto asegura que las rutas empiecen con /mi-presupuesto/
  build: {
    outDir: 'dist',
  }
})