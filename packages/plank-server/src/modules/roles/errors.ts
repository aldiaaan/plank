import { ClientError } from "../../server/errors";

export class RoleNameAlreadyTakenError extends ClientError {
  message = "A role with this name already exists.";
  code = "ERR-ROLE-0001";
  statusCode = 409;
}
