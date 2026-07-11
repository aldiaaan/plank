import type { Database } from "..";
import { users } from "../schema";

export async function getUsers(db: Database) {
  return db.select().from(users).limit(1);
}
