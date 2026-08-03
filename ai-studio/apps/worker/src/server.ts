import express from "express";

const app = express();
const port = Number(process.env.WORKER_PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.post("/jobs", (req, res) => {
  res.status(202).json({ accepted: true, job: req.body, queuedAt: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Worker listening on :${port}`);
});
