import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications, pushSubscriptions } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const notificationsRouter = Router();

// Notification rows carry no audience/role column — they're targeted purely
// by userId at insert time. If a user was ever briefly an admin (promoted
// then demoted) their history can still contain admin-only rows (chat/
// withdrawal alerts pointing at /admin/...) inserted while they had access.
// Non-admins never see those, regardless of how the row ended up under
// their id — belt-and-suspenders on top of getting the insert side right.
const NOT_ADMIN_ONLY = sql`(${notifications.data} ->> 'url' IS NULL OR ${notifications.data} ->> 'url' NOT LIKE '/admin%')`;

notificationsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 30;
    const offset = (page - 1) * limit;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === "admin";

    const scope = isAdmin
      ? eq(notifications.userId, userId)
      : and(eq(notifications.userId, userId), NOT_ADMIN_ONLY);

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(scope)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(notifications).where(scope),
    ]);

    res.json({ data: rows, total: countResult[0]?.count ?? 0, page, limit });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

notificationsRouter.get(
  "/unread-count",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const isAdmin = req.user!.role === "admin";
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          isAdmin
            ? and(eq(notifications.userId, req.user!.userId), isNull(notifications.readAt))
            : and(
                eq(notifications.userId, req.user!.userId),
                isNull(notifications.readAt),
                NOT_ADMIN_ONLY,
              ),
        );
      res.json({ count: Number(row?.count ?? 0) });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ error: "Failed to load unread count" });
    }
  },
);

notificationsRouter.post(
  "/:id/read",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.id, req.params.id),
            eq(notifications.userId, req.user!.userId),
          ),
        );
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  },
);

notificationsRouter.post(
  "/read-all",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, req.user!.userId),
            isNull(notifications.readAt),
          ),
        );
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications read:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  },
);

notificationsRouter.get("/push/vapid-public-key", (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? null });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

notificationsRouter.post(
  "/push/subscribe",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      await db
        .insert(pushSubscriptions)
        .values({
          userId: req.user!.userId,
          endpoint: parsed.data.endpoint,
          p256dh: parsed.data.keys.p256dh,
          auth: parsed.data.keys.auth,
        })
        .onConflictDoUpdate({
          target: pushSubscriptions.endpoint,
          set: {
            userId: req.user!.userId,
            p256dh: parsed.data.keys.p256dh,
            auth: parsed.data.keys.auth,
          },
        });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ error: "Failed to save push subscription" });
    }
  },
);

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

notificationsRouter.post(
  "/push/unsubscribe",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const parsed = unsubscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.endpoint, parsed.data.endpoint),
            eq(pushSubscriptions.userId, req.user!.userId),
          ),
        );
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ error: "Failed to remove push subscription" });
    }
  },
);
