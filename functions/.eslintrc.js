/* eslint-disable */

module.exports = {
  root: true,
  env: { node: true, es6: true },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  parserOptions: {
    project: ["tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["lib/**/*", ".eslintrc.js"],
  rules: {
    "@typescript-eslint/no-unused-expressions": "off",
  },
};
