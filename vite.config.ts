import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // swisseph-wasm ships a .wasm + .data pair that must not be pre-bundled.
  optimizeDeps: { exclude: ['swisseph-wasm'] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
