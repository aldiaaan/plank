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
