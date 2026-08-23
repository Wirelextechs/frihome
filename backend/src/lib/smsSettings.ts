import { db } from "../db/index.js";
import { smsSettings } from "../db/schema.js";

export interface SmsRules {
  registrationConfirmedEnabled: boolean;
  withdrawalRequestedEnabled: boolean;
  withdrawalApprovedEnabled: boolean;
  depositConfirmedEnabled: boolean;
  referralRewardEnabled: boolean;
  suspiciousAdjustmentEnabled: boolean;
  packagePurchaseEnabled: boolean;
  chatMessageEnabled: boolean;
  depositReviewEnabled: boolean;
  adminAlertPhones: string[];
}

export async function getSmsRules(): Promise<SmsRules> {
  const [row] = await db.select().from(smsSettings).limit(1);
  return {
    registrationConfirmedEnabled: row?.registrationConfirmedEnabled ?? true,
    withdrawalRequestedEnabled: row?.withdrawalRequestedEnabled ?? true,
    withdrawalApprovedEnabled: row?.withdrawalApprovedEnabled ?? true,
    depositConfirmedEnabled: row?.depositConfirmedEnabled ?? true,
    referralRewardEnabled: row?.referralRewardEnabled ?? true,
    suspiciousAdjustmentEnabled: row?.suspiciousAdjustmentEnabled ?? true,
    packagePurchaseEnabled: row?.packagePurchaseEnabled ?? true,
    chatMessageEnabled: row?.chatMessageEnabled ?? true,
    depositReviewEnabled: row?.depositReviewEnabled ?? true,
    adminAlertPhones: row?.adminAlertPhones ?? [],
  };
}
