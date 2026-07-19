import { ClientError } from "../../server/errors";

export class InvalidCredentialsError extends ClientError {
  message: string = "Invalid credentials, please try again.";
  code: string = "ERR-0100";
  statusCode: number = 401;
}
