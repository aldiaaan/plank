import { ClientError } from "../../server/errors";

export class InvalidCredentialsError extends ClientError {
  message = "Invalid credentials, please try again.";
  code = "ERR-0100";
  statusCode = 401;
}

export class UnauthorizedError extends ClientError {
  message = "Unauthorized: Session required";
  code = "ERR-0101";
  statusCode = 401;
}

export class ForbiddenError extends ClientError {
  message = "Forbidden: Insufficient permissions";
  code = "ERR-0102";
  statusCode = 403;
}

export class CannotImpersonateSelfError extends ClientError {
  message = "You cannot impersonate yourself.";
  code = "ERR-0103";
  statusCode = 400;
}

export class AlreadyImpersonatingError extends ClientError {
  message = "You are already impersonating a user. Stop impersonating first.";
  code = "ERR-0104";
  statusCode = 400;
}

export class NotImpersonatingError extends ClientError {
  message = "You are not currently impersonating a user.";
  code = "ERR-0105";
  statusCode = 400;
}

export class ImpersonationUserNotFoundError extends ClientError {
  message = "The user to impersonate was not found.";
  code = "ERR-0106";
  statusCode = 404;
}
