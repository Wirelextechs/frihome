import { Router } from "express";
import multer from "multer";
import { eq, gte, and, desc, sql, or, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  users,
  kycVerifications,
  projects,
  investments,
  wallets,
  walletTransactions,
  cryptoPayments,
  auditLogs,
  adminPermissions,
  withdrawalMethods,
} from "../db/schema.js";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
  FULL_ACCESS_PERMISSION,
  ADMIN_SCOPES,
  type AuthedRequest,
} from "../middleware/auth.js";
import { runDailyRoiAccrual } from "../lib/roiAccrual.js";
import { uploadProjectImage } from "../lib/storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

export const adminRouter = Router();

// Apply auth and admin checks to all routes
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin);

// Never leak passwordHash to the admin frontend
const SAFE_USER_COLUMNS = {
  id: users.id,
  email: users.email,
  fullName: users.fullName,
  country: users.country,
  preferredCurrency: users.preferredCurrency,
  role: users.role,
  kycStatus: users.kycStatus,
  isSuspended: users.isSuspended,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

// Audit log helper
async function logAdminAction(
  adminId: string,
  action: string,
  resource: string,
  resourceId: string,
  metadata?: Record<string, any>,
) {
  await db.insert(auditLogs).values({
    userId: adminId,
    action,
    resource,
    resourceId,
    metadata,
  });
}

// ============ USERS ============

adminRouter.get("/users", async (req: AuthedRequest, res) => {
  try {
    const search = (req.query.search as string) || "";
    const kycStatus = (req.query.kycStatus as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(users.email, searchPattern),
          ilike(users.fullName, searchPattern),
        ),
      );
    }

    if (kycStatus) {
      conditions.push(eq(users.kycStatus, kycStatus as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const query = whereClause
      ? db.select(SAFE_USER_COLUMNS).from(users).where(whereClause)
      : db.select(SAFE_USER_COLUMNS).from(users);

    const data = await query.limit(limit).offset(offset);
    const countQuery = whereClause
      ? db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause)
      : db.select({ count: sql<number>`count(*)` }).from(users);
    const countResult = await countQuery;
    const total = countResult[0]?.count || 0;

    res.json({ data, total, page, limit });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

adminRouter.get("/users/:userId", async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db
      .select(SAFE_USER_COLUMNS)
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [kyc] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId));

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId));

    const investments_data = await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId));

    const txns = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(10);

    const permissionRows =
      user.role === "admin"
        ? await db
            .select({ permission: adminPermissions.permission })
            .from(adminPermissions)
            .where(eq(adminPermissions.adminId, userId))
        : [];
    const permissions = permissionRows.map((r) => r.permission);

    res.json({
      user,
      kyc,
      wallet,
      investments: investments_data,
      recentTxns: txns,
      permissions,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

adminRouter.post("/users/:userId/suspend", requirePermission("users.manage"), async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    await db
      .update(users)
      .set({ isSuspended: true })
      .where(eq(users.id, userId));

    await logAdminAction(
      req.user!.userId,
      "SUSPEND_USER",
      "users",
      userId,
      { reason },
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ error: "Failed to suspend user" });
  }
});

adminRouter.post("/users/:userId/activate", requirePermission("users.manage"), async (req: AuthedRequest, res) => {
  try {
    const { userId } = req.params;

    await db
      .update(users)
      .set({ isSuspended: false })
      .where(eq(users.id, userId));

    await logAdminAction(req.user!.userId, "ACTIVATE_USER", "users", userId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({ error: "Failed to activate user" });
  }
});

adminRouter.get("/permissions/scopes", requirePermission("admins.manage"), async (_req, res) => {
  res.json({ scopes: ADMIN_SCOPES });
});

const promoteSchema = z.object({
  level: z.enum(["full", "limited"]),
  permissions: z.array(z.enum(ADMIN_SCOPES)).optional(),
});

adminRouter.post(
  "/users/:userId/promote",
  requirePermission("admins.manage"),
  async (req: AuthedRequest, res) => {
    try {
      const { userId } = req.params;
      const parsed = promoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const { level, permissions } = parsed.data;

      const [target] = await db.select().from(users).where(eq(users.id, userId));
      if (!target) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.update(users).set({ role: "admin" }).where(eq(users.id, userId));

      // Reset existing grants, then re-grant based on the chosen level
      await db.delete(adminPermissions).where(eq(adminPermissions.adminId, userId));

      if (level === "full") {
        await db
          .insert(adminPermissions)
          .values({ adminId: userId, permission: FULL_ACCESS_PERMISSION });
      } else {
        const scopes = permissions ?? [];
        if (scopes.length > 0) {
          await db
            .insert(adminPermissions)
            .values(scopes.map((permission) => ({ adminId: userId, permission })));
        }
      }

      await logAdminAction(req.user!.userId, "PROMOTE_USER", "users", userId, {
        level,
        permissions,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error promoting user:", error);
      res.status(500).json({ error: "Failed to promote user" });
    }
  },
);

adminRouter.post(
  "/users/:userId/demote",
  requirePermission("admins.manage"),
  async (req: AuthedRequest, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user!.userId) {
        return res.status(400).json({ error: "You cannot demote yourself" });
      }

      const [target] = await db.select().from(users).where(eq(users.id, userId));
      if (!target) {
        return res.status(404).json({ error: "User not found" });
      }

      await db.update(users).set({ role: "investor" }).where(eq(users.id, userId));
      await db.delete(adminPermissions).where(eq(adminPermissions.adminId, userId));

      await logAdminAction(req.user!.userId, "DEMOTE_USER", "users", userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error demoting user:", error);
      res.status(500).json({ error: "Failed to demote user" });
    }
  },
);

// ============ KYC ============

adminRouter.get("/kyc/pending", async (req: AuthedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.status, "pending"))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(kycVerifications)
      .where(eq(kycVerifications.status, "pending"));
    const total = countResult[0]?.count || 0;

    res.json({ data, total, page, limit });
  } catch (error) {
    console.error("Error fetching pending KYC:", error);
    res.status(500).json({ error: "Failed to fetch pending KYC" });
  }
});

adminRouter.post("/kyc/:kycId/approve", requirePermission("kyc.manage"), async (req: AuthedRequest, res) => {
  try {
    const { kycId } = req.params;

    const [kyc] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.id, kycId));

    if (!kyc) {
      return res.status(404).json({ error: "KYC not found" });
    }

    await db
      .update(kycVerifications)
      .set({ status: "verified", reviewedAt: new Date() })
      .where(eq(kycVerifications.id, kycId));

    await db
      .update(users)
      .set({ kycStatus: "verified" })
      .where(eq(users.id, kyc.userId));

    await logAdminAction(req.user!.userId, "APPROVE_KYC", "kyc_verifications", kycId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({ error: "Failed to approve KYC" });
  }
});

adminRouter.post("/kyc/:kycId/reject", requirePermission("kyc.manage"), async (req: AuthedRequest, res) => {
  try {
    const { kycId } = req.params;
    const { reason } = req.body;

    const [kyc] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.id, kycId));

    if (!kyc) {
      return res.status(404).json({ error: "KYC not found" });
    }

    await db
      .update(kycVerifications)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(eq(kycVerifications.id, kycId));

    await db
      .update(users)
      .set({ kycStatus: "rejected" })
      .where(eq(users.id, kyc.userId));

    await logAdminAction(req.user!.userId, "REJECT_KYC", "kyc_verifications", kycId, {
      reason,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    res.status(500).json({ error: "Failed to reject KYC" });
  }
});

// ============ PROJECTS ============

adminRouter.get("/projects", async (req: AuthedRequest, res) => {
  try {
    const isActive = req.query.active !== "false";

    const query = db
      .select()
      .from(projects)
      .where(eq(projects.isActive, isActive))
      .orderBy(desc(projects.createdAt));

    const data = await query;

    res.json({ data });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

adminRouter.get("/projects/:projectId", async (req: AuthedRequest, res) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.projectId));

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ data: project });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

const projectFieldsSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  targetAmountGhs: z.coerce.number().positive(),
  minInvestmentGhs: z.coerce.number().positive(),
  maxInvestmentGhs: z.coerce.number().positive().optional().nullable(),
  expectedReturnPct: z.coerce.number().positive(),
  durationMonths: z.coerce.number().int().positive(),
  imageUrl: z.string().url().optional().nullable(),
}).refine(
  (data) =>
    data.maxInvestmentGhs == null || data.maxInvestmentGhs >= data.minInvestmentGhs,
  { message: "Maximum investment must be greater than or equal to minimum investment", path: ["maxInvestmentGhs"] },
);

adminRouter.post("/projects", requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  try {
    const parsed = projectFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { data } = parsed;
    const [project] = await db
      .insert(projects)
      .values({
        title: data.title,
        description: data.description,
        location: data.location,
        targetAmountGhs: data.targetAmountGhs.toString(),
        minInvestmentGhs: data.minInvestmentGhs.toString(),
        maxInvestmentGhs: data.maxInvestmentGhs?.toString(),
        expectedReturnPct: data.expectedReturnPct.toString(),
        durationMonths: data.durationMonths.toString(),
        imageUrl: data.imageUrl,
      })
      .returning();

    await logAdminAction(req.user!.userId, "CREATE_PROJECT", "projects", project.id);

    res.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

adminRouter.patch("/projects/:projectId", requirePermission("projects.manage"), async (req: AuthedRequest, res) => {
  try {
    const { projectId } = req.params;
    const parsed = projectFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { data } = parsed;

    const [project] = await db
      .update(projects)
      .set({
        title: data.title,
        description: data.description,
        location: data.location,
        targetAmountGhs: data.targetAmountGhs.toString(),
        minInvestmentGhs: data.minInvestmentGhs.toString(),
        maxInvestmentGhs: data.maxInvestmentGhs?.toString() ?? null,
        expectedReturnPct: data.expectedReturnPct.toString(),
        durationMonths: data.durationMonths.toString(),
        imageUrl: data.imageUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    await logAdminAction(req.user!.userId, "UPDATE_PROJECT", "projects", projectId, {
      updates: data,
    });

    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

const fundingStatusSchema = z.object({
  status: z.enum(["open", "target_reached", "stopped"]),
});

adminRouter.post(
  "/projects/:projectId/funding-status",
  requirePermission("projects.manage"),
  async (req: AuthedRequest, res) => {
    try {
      const { projectId } = req.params;
      const parsed = fundingStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const [project] = await db
        .update(projects)
        .set({ fundingStatus: parsed.data.status, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      await logAdminAction(
        req.user!.userId,
        "SET_FUNDING_STATUS",
        "projects",
        projectId,
        { status: parsed.data.status },
      );

      res.json(project);
    } catch (error) {
      console.error("Error updating funding status:", error);
      res.status(500).json({ error: "Failed to update funding status" });
    }
  },
);

adminRouter.post(
  "/uploads/image",
  requirePermission("projects.manage"),
  upload.single("image"),
  async (req: AuthedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }
      const url = await uploadProjectImage(
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
      );
      res.json({ url });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

// ============ FINANCIALS ============

adminRouter.get("/financials/dashboard", async (req: AuthedRequest, res) => {
  try {
    const investedResult = await db
      .select({
        total: sql<string>`SUM(amount_ghs)`,
      })
      .from(investments);

    const paidOutResult = await db
      .select({ total: sql<string>`SUM(amount_ghs)` })
      .from(walletTransactions)
      .where(eq(walletTransactions.type, "payout"));

    const depositedResult = await db
      .select({ total: sql<string>`SUM(balance_after_ghs)` })
      .from(walletTransactions)
      .where(eq(walletTransactions.type, "deposit"));

    const dailyPayouts = await db
      .select({ count: sql<number>`count(*)`, total: sql<string>`SUM(amount_ghs)` })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.type, "payout"),
          gte(
            walletTransactions.createdAt,
            sql`NOW() - INTERVAL '1 day'`,
          ),
        ),
      );

    const withdrawnResult = await db
      .select({ total: sql<string>`SUM(amount_ghs)` })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.type, "withdrawal"),
          eq(walletTransactions.status, "completed"),
        ),
      );

    res.json({
      aum: investedResult[0]?.total || "0",
      totalDeposits: depositedResult[0]?.total || "0",
      totalPayouts: paidOutResult[0]?.total || "0",
      totalWithdrawals: withdrawnResult[0]?.total || "0",
      dailyPayoutsCount: dailyPayouts[0]?.count || 0,
      dailyPayoutsAmount: dailyPayouts[0]?.total || "0",
    });
  } catch (error) {
    console.error("Error fetching financial dashboard:", error);
    res.status(500).json({ error: "Failed to fetch financial data" });
  }
});

// ============ PAYMENTS & CRYPTO ============

adminRouter.get("/payments/crypto", async (req: AuthedRequest, res) => {
  try {
    const status = (req.query.status as string) || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const query = status
      ? db
          .select()
          .from(cryptoPayments)
          .where(eq(cryptoPayments.status, status))
      : db.select().from(cryptoPayments);

    const data = await query
      .orderBy(desc(cryptoPayments.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cryptoPayments);
    const total = countResult[0]?.count || 0;

    res.json({ data, total, page, limit });
  } catch (error) {
    console.error("Error fetching crypto payments:", error);
    res.status(500).json({ error: "Failed to fetch crypto payments" });
  }
});

adminRouter.get("/payments/crypto/:paymentId", async (req: AuthedRequest, res) => {
  try {
    const [payment] = await db
      .select()
      .from(cryptoPayments)
      .where(eq(cryptoPayments.id, req.params.paymentId));

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const [user] = await db
      .select(SAFE_USER_COLUMNS)
      .from(users)
      .where(eq(users.id, payment.userId));

    let project = null;
    if (payment.investmentId) {
      const [investment] = await db
        .select()
        .from(investments)
        .where(eq(investments.id, payment.investmentId));
      if (investment) {
        const [proj] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, investment.projectId));
        project = proj ?? null;
      }
    }

    res.json({ data: { ...payment, user, project } });
  } catch (error) {
    console.error("Error fetching crypto payment:", error);
    res.status(500).json({ error: "Failed to fetch crypto payment" });
  }
});

// ============ WITHDRAWALS ============

adminRouter.get("/withdrawals/pending", async (req: AuthedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.type, "withdrawal"),
          eq(walletTransactions.status, "pending"),
        ),
      )
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.type, "withdrawal"),
          eq(walletTransactions.status, "pending"),
        ),
      );
    const total = countResult[0]?.count || 0;

    const withUserDetails = await Promise.all(
      data.map(async (txn) => {
        const [user] = await db
          .select(SAFE_USER_COLUMNS)
          .from(users)
          .where(eq(users.id, txn.userId));
        const [withdrawalMethod] = await db
          .select()
          .from(withdrawalMethods)
          .where(eq(withdrawalMethods.userId, txn.userId));
        return { ...txn, user, withdrawalMethod };
      }),
    );

    res.json({ data: withUserDetails, total, page, limit });
  } catch (error) {
    console.error("Error fetching pending withdrawals:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

adminRouter.get("/withdrawals/:txnId", async (req: AuthedRequest, res) => {
  try {
    const [txn] = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, req.params.txnId));

    if (!txn) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    const [user] = await db
      .select(SAFE_USER_COLUMNS)
      .from(users)
      .where(eq(users.id, txn.userId));

    const [withdrawalMethod] = await db
      .select()
      .from(withdrawalMethods)
      .where(eq(withdrawalMethods.userId, txn.userId));

    res.json({ data: { ...txn, user, withdrawalMethod } });
  } catch (error) {
    console.error("Error fetching withdrawal:", error);
    res.status(500).json({ error: "Failed to fetch withdrawal" });
  }
});

adminRouter.post("/withdrawals/:txnId/approve", requirePermission("withdrawals.manage"), async (req: AuthedRequest, res) => {
  try {
    const { txnId } = req.params;

    const [txn] = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, txnId));

    if (!txn) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    await db
      .update(walletTransactions)
      .set({ status: "completed" })
      .where(eq(walletTransactions.id, txnId));

    await logAdminAction(req.user!.userId, "APPROVE_WITHDRAWAL", "wallet_transactions", txnId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error approving withdrawal:", error);
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
});

adminRouter.post("/withdrawals/:txnId/reject", requirePermission("withdrawals.manage"), async (req: AuthedRequest, res) => {
  try {
    const { txnId } = req.params;
    const { reason } = req.body;

    const [txn] = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, txnId));

    if (!txn) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    await db
      .update(walletTransactions)
      .set({ status: "failed" })
      .where(eq(walletTransactions.id, txnId));

    // Refund to wallet
    const balance = parseFloat(txn.amountGhs.toString());
    await db
      .update(wallets)
      .set({ balanceGhs: sql`balance_ghs + ${balance}` })
      .where(eq(wallets.userId, txn.userId));

    await logAdminAction(req.user!.userId, "REJECT_WITHDRAWAL", "wallet_transactions", txnId, {
      reason,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error rejecting withdrawal:", error);
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
});

// ============ ADMIN UTILITIES ============

adminRouter.post("/run-daily-roi", async (req: AuthedRequest, res) => {
  try {
    const secret = req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await runDailyRoiAccrual();
    await logAdminAction(
      req.user!.userId,
      "RUN_DAILY_ROI",
      "system",
      "roi_accrual",
      result,
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Error running daily ROI:", error);
    res.status(500).json({ error: "Failed to run daily ROI" });
  }
});

adminRouter.get("/audit-logs", async (req: AuthedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 50;
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs);
    const total = countResult[0]?.count || 0;

    res.json({ data, total, page, limit });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});
