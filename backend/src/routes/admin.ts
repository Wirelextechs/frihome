import { Router } from "express";
import { runDailyRoiAccrual } from "../lib/roiAccrual.js";

export const adminRouter = Router();

adminRouter.post("/run-daily-roi", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const result = await runDailyRoiAccrual();
  res.json({ success: true, ...result });
});
