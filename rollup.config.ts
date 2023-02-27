import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import autoprefixer from "autoprefixer";
import postcss from "rollup-plugin-postcss";
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
      postcss({
        modules: true,
        plugins: [autoprefixer()],
      }),
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
