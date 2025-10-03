import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, './node-build.ts'),
      name: 'server',
      fileName: 'node-build',
      formats: ['es'],
    },
    outDir: 'dist',
    target: 'node22',
    ssr: true,
    rollupOptions: {
      external: [
        'fs', 'path', 'url', 'http', 'https', 'os', 'crypto', 'stream', 'util', 'events', 'buffer', 'querystring', 'child_process',
        'express', 'cors', 'dotenv', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'serverless-http'
      ],
      output: {
        format: 'es',
        entryFileNames: '[name].mjs',
      },
    },
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../client'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
