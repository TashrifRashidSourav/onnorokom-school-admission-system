/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Components render into a simulated browser page (jsdom).
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Styles are irrelevant to what the tests check, and skipping them is faster.
    css: false,
  },
})
