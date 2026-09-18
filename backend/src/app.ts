import express from "express";
import cors from "cors";
import { env } from "./env";
import { shipmentsRouter } from "./routes/shipments";
import { errorHandler } from "./middleware/error";
import { STATUSES, TRANSITIONS } from "./status";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: [env.FRONTEND_URL, /\.vercel\.app$/, "http://localhost:3000"],
    }),
  );
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/meta/statuses", (_req, res) => {
    res.json({ data: { statuses: STATUSES, transitions: TRANSITIONS } });
  });

  app.use("/api/shipments", shipmentsRouter);

  app.use((_req, res) =>
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } }),
  );

  app.use(errorHandler);
  return app;
}