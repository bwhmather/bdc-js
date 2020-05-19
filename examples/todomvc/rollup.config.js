import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';



export default [
  {
    input: 'src/app.ts',
    plugins: [
      typescript({
        abortOnError: false,
      }),
      resolve(),
      terser(),
    ],
    output: {
      format: 'iife',
      name: 'app',
      file: 'dist/app.min.js',
      sourcemap: true,
      sourcemapFile: 'dist/app.min.js.map'
    }
  },
]


