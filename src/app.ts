import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import eventsRouter from "./routes/events";
import joinsRouter from "./routes/joins";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({ name: "Parabondhu API", status: "running" });
});

app.use("/events", eventsRouter);
app.use("/joins", joinsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "The server could not complete this request. Try again." });
});

export default app;
