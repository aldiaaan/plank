import { ClientError } from "../../server/errors";

export class EmailAlreadyTakenError extends ClientError {
  message = "A user with this email already exists.";
  code = "ERR-USER-0001";
  statusCode = 409;
}

export class RoleNotFoundError extends ClientError {
  message = "The selected role was not found.";
  code = "ERR-USER-0002";
  statusCode = 400;
}
