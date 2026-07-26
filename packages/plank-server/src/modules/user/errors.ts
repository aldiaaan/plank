import { ClientError } from "@/server/errors";

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

export class UserNotFoundError extends ClientError {
  message = "The user was not found.";
  code = "ERR-USER-0003";
  statusCode = 404;
}

export class CannotDeleteSelfError extends ClientError {
  message = "You cannot delete your own account.";
  code = "ERR-USER-0004";
  statusCode = 400;
}
