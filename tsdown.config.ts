import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm', 'cjs'],
  deps: { skipNodeModulesBundle: true },
  exports: true,
  dts: { tsconfig: 'src/tsconfig.json' },
  publint: true,
  attw: { level: 'error' },
})
