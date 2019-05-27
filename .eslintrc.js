module.exports = {
  parser: 'babel-eslint',
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      impliedStrict: true,
    },
  },
  plugins: ['prettier'],
  rules: {
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'none',
      },
    ],
    'prettier/prettier': 'error',
    'no-console': 'off',
  },
};
