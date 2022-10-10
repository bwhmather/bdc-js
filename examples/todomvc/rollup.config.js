import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';



export default [
  {
    input: 'src/app.ts',
    plugins: [
      typescript({
        noForceEmit: true,
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


