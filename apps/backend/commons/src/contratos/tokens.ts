export function emisorToken(): string {
  return process.env.JWT_ISSUER ?? "scipos-auth";
}

export function audienciaToken(): string {
  return process.env.JWT_AUDIENCE ?? "scipos-api";
}

export function urlJwks(): string {
  return process.env.AUTH_JWKS_URL ?? "http://localhost:4001/.well-known/jwks.json";
}
