module.exports = {
  root: true,
  plugins: ['node'],
  extends: ['plugin:node/recommended', 'eslint-config-airbnb-base'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  globals: {
    __dirname: 'readonly',
  },
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  rules: {
    quotes: [
      'error',
      'single',
    ],
    'arrow-parens': ['error', 'as-needed'],
    'no-plusplus': 'off',
    'import/extensions': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
  },
};
