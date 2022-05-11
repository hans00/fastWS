module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true
  },
  extends: [
    'standard'
  ],
  plugins: [
    'eslint-plugin-perf-standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'perf-standard/no-instanceof-guard': 2,
    'perf-standard/no-self-in-constructor': 2,
    'perf-standard/check-function-inline': 1
  }
}
