import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// "homepage": "https://amalrivel.github.io/gentsuki-ready-web/",
export default defineConfig({
  plugins: [preact()],
  // base: "/gentsuki-ready-web/",
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  build: {
    target: 'es2020',
  },
})
