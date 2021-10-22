module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jquery: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    quote: ["error", "double"],
    semi: ["error", "always"],
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "none",
      },
    ],
    "no-console": ["off"],
  },
};
