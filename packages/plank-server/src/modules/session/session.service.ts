import { timingSafeEqual } from "node:crypto";

import type { AuthIdentity, Permission } from "@plank/common";
import type { Database, Session } from "@plank/db";
import {
  createSession,
  deleteSessionById,
  findPermissionsByUserId,
  findValidSessionById,
} from "@plank/db/queries/sessions";
import { findUserById } from "@plank/db/queries/users";

import { generateSecureRandomString, hashSecret } from "@/modules/auth/utils";
import {
  InvalidSessionTokenError,
  SessionHashNotMatchError,
  SessionNotFoundError,
} from "@/modules/session/errors";

export type CreateSessionOptions = {
  userId: string;
  expiresAt: Date;
  impersonatorUserId?: string;
};

export type CreateSessionResult = {
  token: string;
  session: Session;
};

export type VerifyResult = {
  user: AuthIdentity;
  permissions: Permission[];
  impersonator: AuthIdentity | null;
};

export class SessionService {
  private readonly db: Database;
  constructor({ db }: { db: Database }) {
    this.db = db;
  }

  async create(options: CreateSessionOptions): Promise<CreateSessionResult> {
    const id = generateSecureRandomString();
    const secret = generateSecureRandomString();
    const secretHash = await hashSecret(secret);
    const token = `${id}.${secret}`;

    const session = await createSession(this.db, {
      id,
      userId: options.userId,
      impersonatorUserId: options.impersonatorUserId,
      secretHash: Buffer.from(secretHash),
      expiresAt: options.expiresAt,
    });

    return { token, session };
  }

  private async parseToken(token: string): Promise<[string, string]> {
    const [id, secret] = token.split(".");

    if (!id || !secret) throw new InvalidSessionTokenError();

    return [id, secret];
  }

  async verify(token: string): Promise<VerifyResult> {
    const [id, secret] = await this.parseToken(token);

    const row = await findValidSessionById(this.db, id);
    if (!row) throw new SessionNotFoundError();

    const secretHash = await hashSecret(secret);
    const storedHash = row.session.secretHash;

    if (
      secretHash.byteLength !== storedHash.byteLength ||
      !timingSafeEqual(secretHash, storedHash)
    )
      throw new SessionHashNotMatchError();

    const permissions = await findPermissionsByUserId(this.db, row.user.id);

    let impersonator: AuthIdentity | null = null;
    if (row.session.impersonatorUserId) {
      const impersonatorUser = await findUserById(
        this.db,
        row.session.impersonatorUserId,
      );
      if (impersonatorUser) {
        impersonator = {
          id: impersonatorUser.id,
          email: impersonatorUser.email,
          name: impersonatorUser.name,
        };
      }
    }

    return {
      user: {
        id: row.user.id,
        email: row.user.email,
        name: row.user.name,
      },
      permissions,
      impersonator,
    };
  }

  async revoke(token: string): Promise<void> {
    const [id] = await this.parseToken(token);
    await deleteSessionById(this.db, id);
  }
}
