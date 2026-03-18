import { defineConfig } from 'oxfmt'

export default defineConfig({
  ignorePatterns: ['README.md', 'tsconfig.json', 'test/**/*'],
  printWidth: 320,
  semi: false,
  singleQuote: true,
})
