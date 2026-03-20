import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  deps: { skipNodeModulesBundle: true },
  exports: true,
  dts: { tsconfig: 'src/tsconfig.json' },
  publint: true,
  attw: { profile: 'esm-only', level: 'error' },
})
