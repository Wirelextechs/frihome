import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";

export const projectsRouter = Router();

// Investor-facing columns: raisedAmountGhs/targetAmountGhs are deliberately
// excluded — fundraising progress is admin-only, investors only see whether
// a project is open for investment via fundingStatus.
const PUBLIC_PROJECT_COLUMNS = {
  id: projects.id,
  title: projects.title,
  description: projects.description,
  location: projects.location,
  minInvestmentGhs: projects.minInvestmentGhs,
  maxInvestmentGhs: projects.maxInvestmentGhs,
  expectedReturnPct: projects.expectedReturnPct,
  durationMonths: projects.durationMonths,
  imageUrl: projects.imageUrl,
  fundingStatus: projects.fundingStatus,
  createdAt: projects.createdAt,
};

projectsRouter.get("/", async (_req, res) => {
  const list = await db
    .select(PUBLIC_PROJECT_COLUMNS)
    .from(projects)
    .where(eq(projects.isActive, true));
  res.json({ projects: list });
});

projectsRouter.get("/:id", async (req, res) => {
  const [project] = await db
    .select(PUBLIC_PROJECT_COLUMNS)
    .from(projects)
    .where(eq(projects.id, req.params.id))
    .limit(1);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json({ project });
});
