import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib-entry.ts'),
      formats: ['es'],
      fileName: 'formz',
    },
    outDir: resolve(__dirname, 'docs/formz/public/formz'),
    emptyOutDir: true,
    rollupOptions: {
      external: ['air-datepicker'],
    },
  },
});
