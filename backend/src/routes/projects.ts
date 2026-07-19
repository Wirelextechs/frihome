import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";
import { requireAuth, requireAdmin, type AuthedRequest } from "../middleware/auth.js";

export const projectsRouter = Router();

projectsRouter.get("/", async (_req, res) => {
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.isActive, true));
  res.json({ projects: list });
});

projectsRouter.get("/:id", async (req, res) => {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, req.params.id))
    .limit(1);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  res.json({ project });
});

const createProjectSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  location: z.string().min(2),
  targetAmountGhs: z.string(),
  minInvestmentGhs: z.string(),
  expectedReturnPct: z.string(),
  durationMonths: z.string(),
  imageUrl: z.string().url().optional(),
});

projectsRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const [project] = await db
      .insert(projects)
      .values(parsed.data)
      .returning();
    res.status(201).json({ project });
  },
);
