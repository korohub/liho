import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'src',
  server: {
    hmr: {
      // Port dynamique pour éviter les conflits
      port: undefined
    }
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorer les warnings "use client" de React Router
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
          return
        }
        warn(warning)
      }
    }
  }
})
