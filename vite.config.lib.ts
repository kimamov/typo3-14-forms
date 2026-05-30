import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib-entry.ts'),
      formats: ['es'],
      fileName: 'formlayer',
    },
    outDir: resolve(__dirname, 'docs/formlayer/public/formlayer'),
    emptyOutDir: true,
    rollupOptions: {
      external: ['@formlayer/plugin-datepicker', '@formlayer/plugin-altcha', '@formlayer/plugin-altcha/typo3'],
    },
  },
});
