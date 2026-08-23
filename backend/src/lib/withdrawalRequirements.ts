import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  withdrawalRequirements,
  projects,
  referralRelationships,
  investments,
  walletTransactions,
} from "../db/schema.js";

// A withdrawal counts toward the sequence once it's been requested and
// hasn't been rejected/cancelled — a pending withdrawal already "uses up"
// that turn slot, a cancelled/rejected one doesn't.
async function getNextWithdrawalTurnNumber(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(walletTransactions)
    .where(
      and(
        eq(walletTransactions.userId, userId),
        eq(walletTransactions.type, "withdrawal"),
        inArray(walletTransactions.status, ["pending", "completed"]),
      ),
    );
  return Number(row?.count ?? 0) + 1;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export async function checkWithdrawalRequirements(
  userId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const nextTurn = await getNextWithdrawalTurnNumber(userId);

  // Checkpoints are cumulative: a rule set for turn 3 must be met by turn 3
  // and stays enforced on every later attempt until it's satisfied — a user
  // who reached turn 4 without ever meeting turn 3's requirement (e.g. it
  // didn't exist yet when they withdrew) is blocked on turn 4 until they
  // satisfy turn 3's rule, not silently let through because turn 3 already
  // "happened".
  const allRules = await db
    .select({
      turnNumber: withdrawalRequirements.turnNumber,
      minDirectInvites: withdrawalRequirements.minDirectInvites,
      minInvestmentGhs: projects.minInvestmentGhs,
      packageTitle: projects.title,
    })
    .from(withdrawalRequirements)
    .innerJoin(projects, eq(projects.id, withdrawalRequirements.minPackageId))
    .where(
      and(
        lte(withdrawalRequirements.turnNumber, nextTurn),
        eq(withdrawalRequirements.isActive, true),
      ),
    )
    .orderBy(asc(withdrawalRequirements.turnNumber));

  if (allRules.length === 0) return { ok: true };

  // Each direct invite's tier is their highest-priced active package.
  const inviteTiers = await db
    .select({
      refereeId: referralRelationships.refereeId,
      maxTierGhs: sql<string>`max(${projects.minInvestmentGhs})`,
    })
    .from(referralRelationships)
    .innerJoin(
      investments,
      and(
        eq(investments.userId, referralRelationships.refereeId),
        eq(investments.status, "active"),
      ),
    )
    .innerJoin(projects, eq(projects.id, investments.projectId))
    .where(
      and(
        eq(referralRelationships.referrerId, userId),
        eq(referralRelationships.level, 1),
      ),
    )
    .groupBy(referralRelationships.refereeId);

  const tiers = inviteTiers.map((t) => Number(t.maxTierGhs));

  const rulesByTurn = new Map<number, typeof allRules>();
  for (const rule of allRules) {
    if (!rulesByTurn.has(rule.turnNumber)) rulesByTurn.set(rule.turnNumber, []);
    rulesByTurn.get(rule.turnNumber)!.push(rule);
  }

  for (const [turnNumber, rules] of [...rulesByTurn.entries()].sort((a, b) => a[0] - b[0])) {
    const satisfied = rules.some((rule) => {
      const threshold = Number(rule.minInvestmentGhs);
      const qualifyingCount = tiers.filter((t) => t >= threshold).length;
      return qualifyingCount >= rule.minDirectInvites;
    });
    if (satisfied) continue;

    const alternatives = rules
      .map(
        (r) =>
          `${r.minDirectInvites} direct invite${r.minDirectInvites === 1 ? "" : "s"} with at least a ${r.packageTitle} package`,
      )
      .join(", or ");
    return {
      ok: false,
      reason:
        turnNumber === nextTurn
          ? `To make this withdrawal (your ${ordinal(nextTurn)}), you need ${alternatives}.`
          : `Your ${ordinal(turnNumber)} withdrawal requirement wasn't met: you need ${alternatives}. Please meet this to proceed with your ${ordinal(nextTurn)} withdrawal.`,
    };
  }

  return { ok: true };
}
