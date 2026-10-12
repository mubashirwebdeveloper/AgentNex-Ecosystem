import express, { type Express, type ErrorRequestHandler } from "express";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./middlewares/clerkProxyMiddleware";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(express.json({ limit: "16kb" }));
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(getClerkProxyHost(req) ?? "", process.env.CLERK_PUBLISHABLE_KEY),
})));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (["POST", "PATCH", "DELETE", "PUT"].includes(req.method)) {
    const origin = req.get("origin");
    const host = getClerkProxyHost(req) ?? req.get("host");
    if (origin) {
      try {
        if (new URL(origin).host !== host) { res.status(403).json({ error: "Cross-origin request rejected." }); return; }
      } catch { res.status(403).json({ error: "Invalid origin." }); return; }
    }
    if (req.get("sec-fetch-site") === "cross-site") { res.status(403).json({ error: "Cross-site request rejected." }); return; }
  }
  next();
});

app.use("/api", router);
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const status = error?.status === 400 ? 400 : error?.status === 413 ? 413 : 500;
  req.log.error({ status }, "Request failed");
  res.status(status).json({ error: status === 500 ? "Something went wrong. Please try again." : "Invalid request body." });
};
app.use(errorHandler);

export default app;
