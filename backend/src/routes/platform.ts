import { Router } from "express";
import { db } from "../db/index.js";
import { platformSettings } from "../db/schema.js";

export const platformRouter = Router();

// Public: launch date for the "days in operation" banner. Defaults to now
// if the admin has never set one, so this never 500s on a fresh install.
platformRouter.get("/", async (_req, res) => {
  try {
    const [row] = await db.select().from(platformSettings).limit(1);
    res.json({ launchDate: (row?.launchDate ?? new Date()).toISOString() });
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    res.status(500).json({ error: "Failed to fetch platform settings" });
  }
});
