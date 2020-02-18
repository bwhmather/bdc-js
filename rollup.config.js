import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';


export default [
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        abortOnError: false,
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationDir: "dist/types",
          },
        },
      }),
    ],
    output: {
      format: 'es',
      file: 'dist/bdc.mjs',
      sourcemap: true,
      sourcemapFile: 'dist/bdc.mjs.map'
    }
  },
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        abortOnError: false,
      }),
    ],
    output: {
      format: 'cjs',
      file: 'dist/bdc.umd.js',
      sourcemap: true,
      sourcemapFile: 'dist/bdc.umd.js.map'
    }
  },
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        abortOnError: false,
      }),
    ],
    output: {
      format: 'iife',
      name: 'bdc',
      file: 'dist/bdc.js',
      sourcemap: true,
      sourcemapFile: 'dist/bdc.js.map',
    }
  },
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        abortOnError: false,
      }),
      terser(),
    ],
    output: {
      format: 'iife',
      name: 'bdc',
      file: 'dist/bdc.min.js',
      sourcemap: true,
      sourcemapFile: 'dist/bdc.min.js.map'
    }
  },
]


