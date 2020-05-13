import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';


export default [
  {
    input: 'src/app.ts',
    plugins: [
      typescript({
        abortOnError: false,
      }),
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


