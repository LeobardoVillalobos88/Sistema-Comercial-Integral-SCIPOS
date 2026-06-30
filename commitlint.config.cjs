// Valida que los mensajes de commit sigan Conventional Commits.
// Ejemplos válidos:
//   feat(productos): tabla de catálogo con filtros
//   fix(cotizaciones): corrige cálculo de subtotal
//   chore(commons): agrega tema base de MUI
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    // Permitimos asuntos en español (sin forzar minúscula inicial estricta).
    "subject-case": [0],
  },
};
