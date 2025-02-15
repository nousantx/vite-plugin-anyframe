export default {
  build: {
    lib: {
      entry: './plugin/index.js',
      formats: ['es'],
      filename: 'plugin'
    },
    rollupOptions: {
      external: ['node:fs', 'node:path', '@anyframe/core', 'glob']
    }
  }
}
