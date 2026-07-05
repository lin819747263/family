module.exports = {
  env: {
    node: true,
    es2021: true,
    commonjs: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-undef': 'error',
    'no-duplicate-case': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'prefer-const': 'warn',
    'no-var': 'warn',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'multi-line'],
    'no-multiple-empty-lines': ['warn', { max: 2 }],
    'no-trailing-spaces': 'warn',
    'comma-dangle': ['warn', 'never'],
    semi: ['warn', 'always'],
    quotes: ['warn', 'single', { avoidEscape: true }],
    indent: ['warn', 2, { SwitchCase: 1 }]
  }
};
