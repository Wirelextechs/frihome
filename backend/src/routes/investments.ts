import { Router } from "express";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  investments,
  projects,
  portfolios,
  wallets,
  walletTransactions,
  payouts,
} from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { creditReferralRewards } from "../lib/referrals.js";

export const investmentsRouter = Router();

const createInvestmentSchema = z.object({
  projectId: z.string().uuid(),
  amountGhs: z.string(),
});

investmentsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createInvestmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = req.user!.userId;
  const { projectId, amountGhs } = parsed.data;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project || !project.isActive) {
    return res.status(404).json({ error: "Project not found" });
  }
  if (project.fundingStatus !== "open") {
    return res.status(400).json({
      error:
        project.fundingStatus === "target_reached"
          ? "This project has reached its funding target and is no longer accepting investments"
          : "This project is no longer accepting investments",
    });
  }
  if (Number(amountGhs) < Number(project.minInvestmentGhs)) {
    return res.status(400).json({
      error: `Minimum investment is ${project.minInvestmentGhs} GHS`,
    });
  }
  if (
    project.maxInvestmentGhs != null &&
    Number(amountGhs) > Number(project.maxInvestmentGhs)
  ) {
    return res.status(400).json({
      error: `Maximum investment is ${project.maxInvestmentGhs} GHS`,
    });
  }

  const [wallet] = await db
    .insert(wallets)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  const [currentWallet] =
    wallet !== undefined
      ? [wallet]
      : await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);

  const balanceBefore = Number(currentWallet.balanceGhs);
  const amount = Number(amountGhs);
  if (amount > balanceBefore) {
    return res.status(400).json({
      error: "Insufficient wallet balance. Top up your wallet first.",
    });
  }
  const balanceAfter = balanceBefore - amount;

  await db
    .update(wallets)
    .set({ balanceGhs: balanceAfter.toFixed(2), updatedAt: new Date() })
    .where(eq(wallets.userId, userId));

  const [investment] = await db
    .insert(investments)
    .values({ userId, projectId, amountGhs, status: "active" })
    .returning();

  await db.insert(walletTransactions).values({
    userId,
    type: "investment",
    amountGhs: amount.toFixed(2),
    balanceBeforeGhs: balanceBefore.toFixed(2),
    balanceAfterGhs: balanceAfter.toFixed(2),
    status: "completed",
    description: `Investment in ${project.title}`,
  });

  await db
    .update(projects)
    .set({ raisedAmountGhs: sql`${projects.raisedAmountGhs} + ${amountGhs}` })
    .where(eq(projects.id, projectId));

  const newRaised = Number(project.raisedAmountGhs) + amount;
  if (newRaised >= Number(project.targetAmountGhs) && project.fundingStatus === "open") {
    await db
      .update(projects)
      .set({ fundingStatus: "target_reached" })
      .where(eq(projects.id, projectId));
  }

  await db
    .insert(portfolios)
    .values({ userId, totalInvestedGhs: amountGhs })
    .onConflictDoUpdate({
      target: portfolios.userId,
      set: {
        totalInvestedGhs: sql`${portfolios.totalInvestedGhs} + ${amountGhs}`,
        updatedAt: new Date(),
      },
    });

  await creditReferralRewards(userId, investment.id, amountGhs).catch((err) =>
    console.error("Failed to credit referral rewards:", err),
  );

  res.status(201).json({ investment });
});

investmentsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const list = await db
    .select({
      id: investments.id,
      projectId: investments.projectId,
      amountGhs: investments.amountGhs,
      status: investments.status,
      createdAt: investments.createdAt,
      projectTitle: projects.title,
      projectImageUrl: projects.imageUrl,
    })
    .from(investments)
    .innerJoin(projects, eq(projects.id, investments.projectId))
    .where(eq(investments.userId, userId));
  res.json({ investments: list });
});

investmentsRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const [investment] = await db
    .select()
    .from(investments)
    .where(eq(investments.id, req.params.id))
    .limit(1);
  if (!investment || investment.userId !== req.user!.userId) {
    return res.status(404).json({ error: "Investment not found" });
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, investment.projectId))
    .limit(1);

  const paidPayouts = await db
    .select()
    .from(payouts)
    .where(
      and(eq(payouts.investmentId, investment.id), eq(payouts.status, "paid")),
    );

  const totalEarnedGhs = paidPayouts
    .reduce((sum, p) => sum + Number(p.amountGhs), 0)
    .toFixed(2);

  res.json({ investment, project, totalEarnedGhs });
});
