import typescript from 'rollup-plugin-typescript2';
import { uglify } from 'rollup-plugin-uglify';


export default [
  {
    input: 'src/app.ts',
    plugins: [
      typescript({
        abortOnError: false,
      }),
      uglify(),
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


