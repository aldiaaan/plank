import { Type } from "typebox";

/**
 * Builds a success response schema: `{ message: string, result: T }`.
 */
export const SuccessResponse = <T extends Parameters<typeof Type.Array>[0]>(
  result: T,
) =>
  Type.Object({
    message: Type.String(),
    result,
  });

export type SuccessResponse<T> = {
  message: string;
  result: T;
};

export function successResponse<T>(
  result: T,
  message = "OK",
): SuccessResponse<T> {
  return { message, result };
}
