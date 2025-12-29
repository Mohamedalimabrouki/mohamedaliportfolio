import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mohamedalimabrouki.com',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  },
  server: {
    port: 4173,
    host: true
  }
});
