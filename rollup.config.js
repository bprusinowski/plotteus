import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import del from "rollup-plugin-delete";

const outDir = "dist";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: "src/index.ts",
  output: {
    dir: outDir,
    format: "es",
  },
  cache: false,
  plugins: [
    del({ targets: `${outDir}/*` }),
    nodeResolve(),
    terser({
      format: {
        comments: false,
      },
    }),
    typescript({
      outDir,
    }),
  ],
};

export default config;
