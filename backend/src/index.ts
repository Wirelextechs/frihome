import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { kycRouter } from "./routes/kyc.js";
import { projectsRouter } from "./routes/projects.js";
import { investmentsRouter } from "./routes/investments.js";
import { paymentsRouter } from "./routes/payments.js";
import { usersRouter } from "./routes/users.js";
import { walletRouter } from "./routes/wallet.js";
import { adminRouter } from "./routes/admin.js";
import { runDailyRoiAccrual } from "./lib/roiAccrual.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/investments", investmentsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/admin", adminRouter);

app.listen(port, () => {
  console.log(`AfriHome API listening on http://localhost:${port}`);
});

// Idempotent per calendar day (see lib/roiAccrual.ts), so an hourly check
// is safe — it only actually credits once per investment per day.
runDailyRoiAccrual().catch((err) => console.error("ROI accrual failed:", err));
setInterval(
  () => runDailyRoiAccrual().catch((err) => console.error("ROI accrual failed:", err)),
  60 * 60 * 1000,
);
