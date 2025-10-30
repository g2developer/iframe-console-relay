import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';

const entries = [
  { input: 'src/index.ts', name: 'IframeConsoleRelay', file: 'dist/index.umd.js', minFile: 'dist/index.umd.min.js' },
  { input: 'src/iframe.ts', name: 'IframeConsoleRelayIframe', file: 'dist/iframe.umd.js', minFile: 'dist/iframe.umd.min.js' },
  { input: 'src/parent.ts', name: 'IframeConsoleRelayParent', file: 'dist/parent.umd.js', minFile: 'dist/parent.umd.min.js' },
];

export default entries.flatMap(({ input, name, file, minFile }) => [
  {
    input,
    output: {
      file,
      format: 'umd',
      name,
      sourcemap: true,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      esbuild({ target: 'es2019' }),
    ],
  },
  {
    input,
    output: {
      file: minFile,
      format: 'umd',
      name,
      sourcemap: true,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      esbuild({ target: 'es2019', minify: true }),
    ],
  },
]);

