module.exports = {
  root: true,
  plugins: ['node'],
  extends: ['eslint:recommended', 'plugin:node/recommended', 'eslint-config-airbnb-base'],
  parserOptions: {
    ecmaVersion: 2020,
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
  },
};
