import { Router } from "express";
import { db } from "../db/index.js";
import { platformSettings } from "../db/schema.js";
import { DEFAULT_MAINTENANCE_MESSAGE } from "../lib/maintenance.js";

export const platformRouter = Router();

// Public: launch date for the "days in operation" banner, and maintenance
// mode (checked client-side by every investor page load — admins are never
// blocked by this, see Layout.tsx). Defaults are safe so this never 500s
// and never accidentally locks investors out on a fresh install.
platformRouter.get("/", async (_req, res) => {
  try {
    const [row] = await db.select().from(platformSettings).limit(1);
    res.json({
      launchDate: (row?.launchDate ?? new Date()).toISOString(),
      maintenanceMode: row?.maintenanceMode ?? false,
      maintenanceMessage: row?.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE,
    });
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    res.status(500).json({ error: "Failed to fetch platform settings" });
  }
});
