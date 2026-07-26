import { type Static, Type } from "typebox";

export const ErrorResponse = Type.Object({
  message: Type.String(),
  code: Type.String(),
  statusCode: Type.Number(),
});

export type ErrorResponse = Static<typeof ErrorResponse>;

export class PlankError {
  message: string = "Something went wrong, please try again later.";
  code: string = "ERR-0001";
  statusCode: number = 400;
  toJSON(): ErrorResponse {
    return {
      message: `${this.message} (${this.code})`,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

export class ClientError extends PlankError {}

export class ServerError extends PlankError {
  code = "ERR-S0001";
  toJSON(): ErrorResponse {
    return {
      message: `Something went wrong, please try again later. (${this.code})`,
      code: "ERR-S0001",
      statusCode: this.statusCode,
    };
  }
}
