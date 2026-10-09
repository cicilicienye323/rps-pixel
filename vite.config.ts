import { defineConfig } from 'vite'

// Build and preview use the GitHub Pages path /rps-pixel/; the dev server stays at /.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/rps-pixel/' : '/',
}))
