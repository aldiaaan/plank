import { client } from "./__generated__/client.gen";
import { querySerializer } from "./query-serializer";

client.setConfig({ querySerializer });

export * from "./__generated__/@tanstack/react-query.gen";
export * from "./__generated__/client.gen";
export * from "./__generated__/sdk.gen";
export * from "./__generated__/types.gen";
