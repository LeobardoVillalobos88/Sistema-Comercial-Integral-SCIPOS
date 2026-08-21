// Valida que los mensajes de commit sigan Conventional Commits.
//
// El proyecto los escribe **sin ámbito** y con el asunto en español: la carpeta
// que cambió ya se ve en el diff, y ponerla en el mensaje solo abre la discusión
// de si un cambio que toca dos módulos lleva uno, dos o ninguno.
//
// Ejemplos válidos:
//   feat: catalogo de productos con filtros
//   fix: corrige el subtotal de la cotizacion
//   docs: documenta la estrategia de ramas
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
