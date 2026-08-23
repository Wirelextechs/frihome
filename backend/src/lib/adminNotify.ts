import { eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { adminPermissions } from "../db/schema.js";
import { FULL_ACCESS_PERMISSION, type AdminScope } from "../middleware/auth.js";
import { notify, type NotificationType } from "./notify.js";

// Fans a notification out to every admin holding the given scope (or full
// access) — e.g. every deposits.manage admin when a top-up needs review.
// Mirrors how the admin inbox pages already work: shared queues everyone
// with that permission can see, so everyone with it gets alerted too.
export async function notifyAdminsWithScope(
  scope: AdminScope,
  input: {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
    url?: string;
  },
) {
  const rows = await db
    .select({ adminId: adminPermissions.adminId })
    .from(adminPermissions)
    .where(
      or(
        eq(adminPermissions.permission, scope),
        eq(adminPermissions.permission, FULL_ACCESS_PERMISSION),
      ),
    );

  const adminIds = [...new Set(rows.map((r) => r.adminId))];
  await Promise.all(adminIds.map((adminId) => notify({ ...input, userId: adminId })));
}
