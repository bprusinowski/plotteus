import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default [
  {
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
  },
];
