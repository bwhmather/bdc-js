import typescript from 'rollup-plugin-typescript2';
import { uglify } from 'rollup-plugin-uglify';


export default [
  {
    input: 'src/index.ts',
    plugins: [
      typescript({
        abortOnError: false,
        useTsconfigDeclarationDir: true,
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
        useTsconfigDeclarationDir: true,
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
        useTsconfigDeclarationDir: true,
      }),
    ],
    output: {
      format: 'iife',
      name: 'cp',
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
        useTsconfigDeclarationDir: true,
      }),
      uglify(),
    ],
    output: {
      format: 'iife',
      name: 'cp',
      file: 'dist/bdc.min.js',
      sourcemap: true,
      sourcemapFile: 'dist/bdc.min.js.map'
    }
  },
]


