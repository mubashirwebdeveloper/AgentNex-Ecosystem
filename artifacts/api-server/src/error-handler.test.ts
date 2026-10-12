import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import { errorHandler } from "./lib/error-handler";

test("real HTTP failure responses are safe and the server recovers", async () => {
  const app = express();
  app.use(pinoHttp({ logger: pino({ enabled: false }) }));
  app.use(express.json({ limit: "16b" }));
  // This throwing endpoint exists only in the isolated test app.
  app.get("/failure", () => {
    throw new Error("Internal database error: private_connection_details");
  });
  app.get("/health", (_req, res) => { res.json({ status: "ok" }); });
  app.post("/body", (_req, res) => { res.json({ status: "ok" }); });
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`;

    const failure = await fetch(`${url}/failure`);
    assert.equal(failure.status, 500);
    assert.deepEqual(await failure.json(), {
      error: "Something went wrong. Please try again.",
    });

    const malformed = await fetch(`${url}/body`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: "Invalid request body." });

    const oversized = await fetch(`${url}/body`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "x".repeat(40) }),
    });
    assert.equal(oversized.status, 413);
    assert.deepEqual(await oversized.json(), { error: "Invalid request body." });
    assert.equal((await fetch(`${url}/health`)).status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
