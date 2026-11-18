export default [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        FileReader: "readonly",
        URLSearchParams: "readonly",
        Uint8Array: "readonly",
        btoa: "readonly",
        atob: "readonly",
        alert: "readonly",
        confirm: "readonly",
        Blob: "readonly",
        URL: "readonly",
        FormData: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        navigator: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        ResizeObserver: "readonly",
        IntersectionObserver: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "no-duplicate-case": "error",
      "valid-typeof": "error",
      "use-isnan": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^(_|React)$" }],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }]
    }
  }
];
