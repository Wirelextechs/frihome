import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { kycVerifications, users } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { isValidPhoneForCountry } from "../lib/phone.js";

export const kycRouter = Router();

const kycSchema = z.object({
  fullName: z.string().min(2),
  country: z.string().length(2),
  province: z.string().min(2),
  whatsappNumber: z.string().min(7).max(20),
});

kycRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = kycSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const userId = req.user!.userId;
  const { fullName, country, province, whatsappNumber } = parsed.data;

  if (!isValidPhoneForCountry(country, whatsappNumber)) {
    return res.status(400).json({
      error: "WhatsApp number does not match the selected country's format",
    });
  }

  const [record] = await db
    .insert(kycVerifications)
    .values({
      userId,
      fullName,
      country: country.toUpperCase(),
      province,
      whatsappNumber,
      status: "verified",
      reviewedAt: new Date(),
    })
    .returning();

  await db
    .update(users)
    .set({ kycStatus: "verified", updatedAt: new Date() })
    .where(eq(users.id, userId));

  res.status(201).json({ kyc: record });
});

kycRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const records = await db
    .select()
    .from(kycVerifications)
    .where(eq(kycVerifications.userId, userId));
  res.json({ kyc: records });
});
