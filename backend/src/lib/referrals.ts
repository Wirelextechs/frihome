import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  referralCodes,
  referralRelationships,
  referralRewards,
  referralConfig,
  wallets,
  walletTransactions,
  users,
} from "../db/schema.js";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

function randomCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [existing] = await db
    .select({ code: referralCodes.code })
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      const [inserted] = await db
        .insert(referralCodes)
        .values({ userId, code })
        .onConflictDoNothing({ target: referralCodes.userId })
        .returning({ code: referralCodes.code });
      if (inserted) return inserted.code;
      const [row] = await db
        .select({ code: referralCodes.code })
        .from(referralCodes)
        .where(eq(referralCodes.userId, userId))
        .limit(1);
      if (row) return row.code;
    } catch {
      // code collision, retry with a new random code
      continue;
    }
  }
  throw new Error("Failed to generate a unique referral code");
}

/**
 * Applies a referral code for a brand-new user, inserting up to 3 levels
 * of ancestry (direct referrer, their referrer, and theirs). Silently
 * no-ops on an invalid/self-referential code rather than failing signup.
 */
export async function applyReferralCode(newUserId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return;

  const [codeOwner] = await db
    .select({ userId: referralCodes.userId })
    .from(referralCodes)
    .innerJoin(users, eq(users.id, referralCodes.userId))
    .where(and(eq(referralCodes.code, code), eq(users.isSuspended, false)));

  if (!codeOwner || codeOwner.userId === newUserId) return;

  const chain: { referrerId: string; level: number }[] = [
    { referrerId: codeOwner.userId, level: 1 },
  ];

  const ancestors = await db
    .select({ referrerId: referralRelationships.referrerId, level: referralRelationships.level })
    .from(referralRelationships)
    .where(eq(referralRelationships.refereeId, codeOwner.userId));

  for (const a of ancestors) {
    const level = a.level + 1;
    if (level > 3) continue;
    if (a.referrerId === newUserId) continue; // would create a cycle
    chain.push({ referrerId: a.referrerId, level });
  }

  for (const { referrerId, level } of chain) {
    await db
      .insert(referralRelationships)
      .values({ referrerId, refereeId: newUserId, level })
      .onConflictDoNothing();
  }
}

/**
 * Credits referral rewards to a chain of up to 3 referrers when the
 * referee makes an investment. Only investments trigger rewards — not
 * deposits or withdrawals — so rewards only flow when the referred
 * user's money is actually put to work.
 */
export async function creditReferralRewards(
  refereeId: string,
  investmentId: string,
  investmentAmountGhs: string,
) {
  const relationships = await db
    .select()
    .from(referralRelationships)
    .where(eq(referralRelationships.refereeId, refereeId));

  if (relationships.length === 0) return;

  const configRows = await db.select().from(referralConfig);
  const configByLevel = new Map(configRows.map((c) => [c.level, c]));

  for (const rel of relationships) {
    const config = configByLevel.get(rel.level);
    if (!config || !config.isActive) continue;

    const pct = Number(config.rewardPercentage);
    if (pct <= 0) continue;

    const rewardAmount =
      Math.round(Number(investmentAmountGhs) * (pct / 100) * 100) / 100;
    if (rewardAmount <= 0) continue;

    const [reward] = await db
      .insert(referralRewards)
      .values({
        referrerId: rel.referrerId,
        refereeId,
        level: rel.level,
        investmentId,
        investmentAmountGhs,
        rewardPercentage: config.rewardPercentage,
        rewardAmountGhs: rewardAmount.toFixed(2),
      })
      .onConflictDoNothing({ target: [referralRewards.investmentId, referralRewards.level] })
      .returning();

    if (!reward) continue; // already credited for this investment/level

    const [wallet] = await db
      .insert(wallets)
      .values({ userId: rel.referrerId })
      .onConflictDoNothing()
      .returning();
    const [currentWallet] =
      wallet !== undefined
        ? [wallet]
        : await db.select().from(wallets).where(eq(wallets.userId, rel.referrerId)).limit(1);

    const balanceBefore = Number(currentWallet.balanceGhs);
    const balanceAfter = balanceBefore + rewardAmount;

    await db
      .update(wallets)
      .set({ balanceGhs: balanceAfter.toFixed(2), updatedAt: new Date() })
      .where(eq(wallets.userId, rel.referrerId));

    await db.insert(walletTransactions).values({
      userId: rel.referrerId,
      type: "referral_reward",
      amountGhs: rewardAmount.toFixed(2),
      balanceBeforeGhs: balanceBefore.toFixed(2),
      balanceAfterGhs: balanceAfter.toFixed(2),
      status: "completed",
      description: `Referral reward (Level ${rel.level})`,
    });
  }
}
