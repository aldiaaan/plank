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
