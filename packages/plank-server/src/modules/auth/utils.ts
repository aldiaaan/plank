import { Algorithm, hash, verify } from "@node-rs/argon2";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, { algorithm: Algorithm.Argon2id });
}

export async function verifyPassword(
  password: string,
  hashed: string,
): Promise<boolean> {
  return verify(hashed, password);
}

export function generateSecureRandomString(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);

  let id = "";
  for (let i = 0; i < bytes.length; i++) {
    id += alphabet[bytes[i] >> 3];
  }
  return id;
}

export async function hashSecret(secret: string): Promise<Uint8Array> {
  const secretBytes = new TextEncoder().encode(secret);
  const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return new Uint8Array(secretHashBuffer);
}
