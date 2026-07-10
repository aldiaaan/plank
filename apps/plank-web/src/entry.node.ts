import "react-router";

import { createRequestHandler } from "@react-router/express";
import express from "express";
import { RouterContextProvider } from "react-router";
import { nonceContext } from "./context";

export const app = express();

app.use(
  createRequestHandler({
    getLoadContext(req, res) {
      const context = new RouterContextProvider();
      context.set(nonceContext, res.locals.nonce);
      return context;
    },
    // @ts-ignore
    build: () => import("virtual:react-router/server-build"),
  }),
);
