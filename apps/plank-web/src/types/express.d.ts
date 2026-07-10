declare global {
  namespace Express {
    interface Locals {
      nonce: string;
    }
  }
}

export {};
