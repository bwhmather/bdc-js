import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/index.ts",
    plugins: [
      typescript({
        compilerOptions: {
          declaration: true,
          declarationDir: "dist",
        },
      }),
    ],
    output: [
      {
        format: "es",
        file: "dist/bdc.mjs",
        sourcemap: true,
        sourcemapFile: "dist/bdc.mjs.map",
      },
      {
        format: "cjs",
        file: "dist/bdc.umd.js",
        sourcemap: true,
        sourcemapFile: "dist/bdc.umd.js.map",
      },
      {
        format: "iife",
        name: "bdc",
        file: "dist/bdc.js",
        esModule: false,
        sourcemap: true,
        sourcemapFile: "dist/bdc.js.map",
      },
      {
        format: "iife",
        name: "bdc",
        file: "dist/bdc.min.js",
        esModule: false,
        sourcemap: true,
        sourcemapFile: "dist/bdc.min.js.map",
        plugins: [
          terser({
            ecma: 2016,
            compress: {
              ecma: 2016,
              unsafe: true,
              unsafe_arrows: true,
              unsafe_proto: true,
              passes: 2,
            },
          }),
        ],
      },
    ],
  },
];
