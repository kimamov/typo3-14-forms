import { defineConfig } from "vite";
import { resolve } from "node:path";
import typo3 from "vite-plugin-typo3";

export default defineConfig({
  plugins: [typo3({ debug: true })],
  resolve: {
    alias: {
      formlayer: resolve(__dirname, "src/index.ts"),
      "@formlayer/plugin-datepicker": resolve(
        __dirname,
        "formlayer/packages/plugin-datepicker/src/index.ts",
      ),
      "@formlayer/plugin-altcha/typo3": resolve(
        __dirname,
        "formlayer/packages/plugin-altcha/src/typo3.ts",
      ),
      "@formlayer/plugin-altcha": resolve(
        __dirname,
        "formlayer/packages/plugin-altcha/src/index.ts",
      ),
    },
  },
  build: {
    rollupOptions: {
      input: ["src/main.ts"],
    },
  },
});
