// .eslintrc.js
module.exports = {
    root: true,
    env: {
      node: true,
      jest: true,
      es2021: true
    },
    extends: [
      'eslint:recommended',
      'plugin:node/recommended',
      'plugin:jest/recommended',
      'prettier'
    ],
    plugins: ['jest'],
    parserOptions: {
      ecmaVersion: 2021
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'node/no-unpublished-require': ['error', {
        allowModules: ['sharp', 'jest', 'supertest']
      }],
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-expect': 'error',
      'max-len': ['error', { 
        code: 100,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }]
    },
    overrides: [
      {
        files: [
          '**/__tests__/*.{j,t}s?(x)',
          '**/tests/unit/**/*.spec.{j,t}s?(x)'
        ],
        env: {
          jest: true
        }
      }
    ]
  }