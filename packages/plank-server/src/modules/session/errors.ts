import { ClientError } from "../../server/errors";

export class InvalidSessionTokenError extends ClientError {
  code = "ERR-0200";
  statusCode = 401;
  message = "Invalid session token";
}

export class SessionHashNotMatchError extends ClientError {
  code = "ERR-0201";
  statusCode = 401;
  message = "Cannot verify session token, please login again.";
}

export class SessionNotFoundError extends ClientError {
  code = "ERR-0202";
  statusCode = 401;
  message = "Session not found, please login again.";
}
