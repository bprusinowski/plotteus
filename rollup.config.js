import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "es",
  },
  plugins: [
    nodeResolve(),
    terser({
      format: {
        comments: false,
      },
    }),
    typescript({
      outDir: "dist",
    }),
  ],
};

export default config;
