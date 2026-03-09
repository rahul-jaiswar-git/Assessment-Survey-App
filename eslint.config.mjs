import next from 'eslint-config-next'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  ...next,
  {
    ignores: ['node_modules/**', '.next/**'],
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
]
