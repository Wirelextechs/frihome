import {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  smallint,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "verified",
  "rejected",
]);

export const userRoleEnum = pgEnum("user_role", ["investor", "admin"]);

export const investmentStatusEnum = pgEnum("investment_status", [
  "pending",
  "active",
  "completed",
  "cancelled",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "scheduled",
  "paid",
  "failed",
  "forfeited",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "paystack",
  "crypto",
]);

export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "deposit",
  "withdrawal",
  "investment",
  "payout",
  "refund",
  "referral_reward",
  "reward_claim",
  "adjustment_credit",
  "adjustment_debit",
]);

export const walletTxStatusEnum = pgEnum("wallet_tx_status", [
  "pending",
  "completed",
  "failed",
]);

export const withdrawalMethodTypeEnum = pgEnum("withdrawal_method_type", [
  "momo",
  "bank",
  "crypto",
]);

export const fundingStatusEnum = pgEnum("funding_status", [
  "open",
  "target_reached",
  "stopped",
]);

export const referralRewardStatusEnum = pgEnum("referral_reward_status", [
  "credited",
  "reversed",
]);

export const manualDepositStatusEnum = pgEnum("manual_deposit_status", [
  "pending",
  "approved",
  "rejected",
]);

export const manualDepositMethodEnum = pgEnum("manual_deposit_method", [
  "momo",
  "binance_pay",
]);

export const rewardTypeEnum = pgEnum("reward_type", [
  "fixed",
  "random_range",
]);

export const poolStatusEnum = pgEnum("pool_status", [
  "active",
  "exhausted",
  "expired",
  "paused",
]);

export const rewardClaimResultEnum = pgEnum("reward_claim_result", [
  "success",
  "pool_exhausted",
  "already_claimed",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  preferredCurrency: varchar("preferred_currency", { length: 3 })
    .notNull()
    .default("GHS"),
  role: userRoleEnum("role").notNull().default("investor"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  isSuspended: boolean("is_suspended").notNull().default(false),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kycVerifications = pgTable("kyc_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  province: varchar("province", { length: 255 }).notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }).notNull(),
  status: kycStatusEnum("status").notNull().default("pending"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  targetAmountGhs: numeric("target_amount_ghs", {
    precision: 14,
    scale: 2,
  }).notNull(),
  raisedAmountGhs: numeric("raised_amount_ghs", {
    precision: 14,
    scale: 2,
  })
    .notNull()
    .default("0"),
  minInvestmentGhs: numeric("min_investment_ghs", {
    precision: 14,
    scale: 2,
  }).notNull(),
  maxInvestmentGhs: numeric("max_investment_ghs", {
    precision: 14,
    scale: 2,
  }),
  expectedReturnPct: numeric("expected_return_pct", {
    precision: 5,
    scale: 2,
  }).notNull(),
  durationDays: numeric("duration_days", { precision: 6, scale: 0 }).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  // Off by default: a user may only hold one investment (any status) in a
  // given package. Admins tick this per-package to allow repeat purchases.
  allowDuplicatePurchase: boolean("allow_duplicate_purchase").notNull().default(false),
  fundingStatus: fundingStatusEnum("funding_status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "restrict" }),
  amountGhs: numeric("amount_ghs", { precision: 14, scale: 2 }).notNull(),
  status: investmentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  investmentId: uuid("investment_id")
    .notNull()
    .references(() => investments.id, { onDelete: "cascade" }),
  amountGhs: numeric("amount_ghs", { precision: 14, scale: 2 }).notNull(),
  status: payoutStatusEnum("status").notNull().default("scheduled"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  paidAt: timestamp("paid_at"),
  isManual: boolean("is_manual").notNull().default(false),
  note: text("note"),
  adjustedBy: uuid("adjusted_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  totalInvestedGhs: numeric("total_invested_ghs", {
    precision: 14,
    scale: 2,
  })
    .notNull()
    .default("0"),
  totalReturnsGhs: numeric("total_returns_ghs", {
    precision: 14,
    scale: 2,
  })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cryptoPayments = pgTable("crypto_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  investmentId: uuid("investment_id").references(() => investments.id, {
    onDelete: "set null",
  }),
  network: varchar("network", { length: 50 }).notNull().default("TRC20"),
  asset: varchar("asset", { length: 20 }).notNull().default("USDT"),
  amount: numeric("amount", { precision: 20, scale: 6 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // NOWPayments fields
  providerPaymentId: varchar("provider_payment_id", { length: 100 }),
  amountGhs: numeric("amount_ghs", { precision: 14, scale: 2 }),
  payAmount: numeric("pay_amount", { precision: 20, scale: 8 }),
  payCurrency: varchar("pay_currency", { length: 20 }),
  payAddress: varchar("pay_address", { length: 255 }),
  status: varchar("status", { length: 30 }).notNull().default("waiting"),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  balanceGhs: numeric("balance_ghs", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: walletTxTypeEnum("type").notNull(),
  amountGhs: numeric("amount_ghs", { precision: 14, scale: 2 }).notNull(),
  balanceBeforeGhs: numeric("balance_before_ghs", {
    precision: 14,
    scale: 2,
  }).notNull(),
  balanceAfterGhs: numeric("balance_after_ghs", {
    precision: 14,
    scale: 2,
  }).notNull(),
  status: walletTxStatusEnum("status").notNull().default("completed"),
  method: varchar("method", { length: 30 }),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawalMethods = pgTable("withdrawal_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: withdrawalMethodTypeEnum("type").notNull(),
  network: varchar("network", { length: 30 }),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 100 }),
  cryptoAddress: varchar("crypto_address", { length: 255 }),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 50 }),
  resourceId: varchar("resource_id", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminPermissions = pgTable("admin_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permission: varchar("permission", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  code: varchar("code", { length: 12 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralRelationships = pgTable("referral_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refereeId: uuid("referee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  level: smallint("level").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralRewards = pgTable("referral_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: uuid("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  refereeId: uuid("referee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  level: smallint("level").notNull(),
  investmentId: uuid("investment_id")
    .notNull()
    .references(() => investments.id, { onDelete: "cascade" }),
  investmentAmountGhs: numeric("investment_amount_ghs", {
    precision: 14,
    scale: 2,
  }).notNull(),
  rewardPercentage: numeric("reward_percentage", {
    precision: 5,
    scale: 2,
  }).notNull(),
  rewardAmountGhs: numeric("reward_amount_ghs", {
    precision: 14,
    scale: 2,
  }).notNull(),
  status: referralRewardStatusEnum("status").notNull().default("credited"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  // One reward per investment per referral level — required by the
  // onConflictDoNothing target in creditReferralRewards.
  investmentLevelUnique: uniqueIndex("referral_rewards_investment_level_unique").on(
    t.investmentId,
    t.level,
  ),
}));

export const referralConfig = pgTable("referral_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  level: smallint("level").notNull().unique(),
  rewardPercentage: numeric("reward_percentage", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const depositSettings = pgTable("deposit_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 30 }).notNull().unique().default("momo"),
  network: varchar("network", { length: 30 }).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 30 }).notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Which deposit/top-up methods are visible to users; admin-controlled.
export const depositMethodSettings = pgTable("deposit_method_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  momoEnabled: boolean("momo_enabled").notNull().default(true),
  cryptoEnabled: boolean("crypto_enabled").notNull().default(true),
  chatEnabled: boolean("chat_enabled").notNull().default(true),
  binancePayEnabled: boolean("binance_pay_enabled").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Each admin registers at most one personal Binance Pay ID (enforced by the
// unique adminId below); investors pick one from the active list to pay into.
export const binancePayAccounts = pgTable("binance_pay_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  binanceId: varchar("binance_id", { length: 64 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const manualDeposits = pgTable("manual_deposits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  method: manualDepositMethodEnum("method").notNull().default("momo"),
  reference: varchar("reference", { length: 20 }).notNull().unique(),
  amountGhs: numeric("amount_ghs", { precision: 14, scale: 2 }).notNull(),
  // Momo-specific; null for binance_pay deposits.
  network: varchar("network", { length: 30 }),
  senderNumber: varchar("sender_number", { length: 30 }),
  // Shared "who sent this" label: momo sender name, or the investor's
  // Binance nickname.
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  // Binance Pay-specific; null for momo deposits.
  binanceAccountId: uuid("binance_account_id").references(
    () => binancePayAccounts.id,
    { onDelete: "set null" },
  ),
  senderBinanceId: varchar("sender_binance_id", { length: 64 }),
  senderEmail: varchar("sender_email", { length: 255 }),
  screenshotUrl: text("screenshot_url").notNull(),
  status: manualDepositStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rewardPools = pgTable("reward_pools", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  totalPoolGhs: numeric("total_pool_ghs", { precision: 14, scale: 2 }).notNull(),
  claimedPoolGhs: numeric("claimed_pool_ghs", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  rewardType: rewardTypeEnum("reward_type").notNull(),
  fixedAmountGhs: numeric("fixed_amount_ghs", { precision: 14, scale: 2 }),
  minAmountGhs: numeric("min_amount_ghs", { precision: 14, scale: 2 }),
  maxAmountGhs: numeric("max_amount_ghs", { precision: 14, scale: 2 }),
  allowDuplicateClaims: boolean("allow_duplicate_claims").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  status: poolStatusEnum("status").notNull().default("active"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rewardClaims = pgTable("reward_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  poolId: uuid("pool_id")
    .notNull()
    .references(() => rewardPools.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  claimedAmountGhs: numeric("claimed_amount_ghs", {
    precision: 14,
    scale: 2,
  }).notNull(),
  transactionId: uuid("transaction_id").references(() => walletTransactions.id, {
    onDelete: "set null",
  }),
  claimResult: rewardClaimResultEnum("claim_result").notNull().default("success"),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
});

export const rewardPoolAudit = pgTable("reward_pool_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  poolId: uuid("pool_id")
    .notNull()
    .references(() => rewardPools.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  adminId: uuid("admin_id").references(() => users.id, {
    onDelete: "set null",
  }),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const confirmationTokens = pgTable("confirmation_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  actionData: jsonb("action_data"),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  confirmedBy: uuid("confirmed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chatSenderRoleEnum = pgEnum("chat_sender_role", [
  "user",
  "admin",
  "system",
]);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Thread owner: always the investor's userId, even for admin/system messages
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Actual author (admin's id for admin messages; null for system messages)
    senderId: uuid("sender_id").references(() => users.id, {
      onDelete: "set null",
    }),
    senderRole: chatSenderRoleEnum("sender_role").notNull(),
    body: text("body"),
    imageUrl: text("image_url"),
    // When set, the message renders as a top-up request card
    manualDepositId: uuid("manual_deposit_id").references(
      () => manualDeposits.id,
      { onDelete: "set null" },
    ),
    readByUser: boolean("read_by_user").notNull().default(false),
    readByAdmin: boolean("read_by_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    editedAt: timestamp("edited_at"),
    editedByAdminName: text("edited_by_admin_name"),
  },
  (t) => ({
    userCreatedIdx: index("chat_messages_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
  }),
);

// One row per investor thread. Presence of a row means an admin has claimed
// the thread; deleted on release or replaced on takeover. No expiry — locks
// only clear via explicit release or another admin taking over, so a thread
// is never in limbo waiting on a timer.
export const chatThreadLocks = pgTable("chat_thread_locks", {
  threadUserId: uuid("thread_user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  adminName: text("admin_name").notNull(),
  lockedAt: timestamp("locked_at").notNull().defaultNow(),
});

export const supportSettings = pgTable("support_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  whatsappChannelUrl: text("whatsapp_channel_url"),
  telegramGroupUrl: text("telegram_group_url"),
  telegramProfiles: jsonb("telegram_profiles")
    .$type<{ label: string; url: string }[]>()
    .notNull()
    .default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Mobile money deposit limits/fee.
  momoMinDepositGhs: numeric("min_deposit_ghs", { precision: 14, scale: 2 }),
  momoMaxDepositGhs: numeric("max_deposit_ghs", { precision: 14, scale: 2 }),
  momoDepositFeePct: numeric("deposit_fee_pct", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  // Crypto deposits are always fee-free; these are optional admin caps on top
  // of the live NOWPayments minimum (which fluctuates with the crypto market).
  cryptoMinDepositGhs: numeric("crypto_min_deposit_ghs", { precision: 14, scale: 2 }),
  cryptoMaxDepositGhs: numeric("crypto_max_deposit_ghs", { precision: 14, scale: 2 }),
  // Binance Pay deposit limits/fee.
  binanceMinDepositGhs: numeric("binance_min_deposit_ghs", { precision: 14, scale: 2 }),
  binanceMaxDepositGhs: numeric("binance_max_deposit_ghs", { precision: 14, scale: 2 }),
  binanceDepositFeePct: numeric("binance_deposit_fee_pct", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  minWithdrawalGhs: numeric("min_withdrawal_ghs", { precision: 14, scale: 2 }),
  maxWithdrawalGhs: numeric("max_withdrawal_ghs", { precision: 14, scale: 2 }),
  withdrawalFeePct: numeric("withdrawal_fee_pct", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  // Weekdays withdrawals are allowed (0=Sunday..6=Saturday); empty = every day.
  withdrawalDays: jsonb("withdrawal_days").$type<number[]>().notNull().default([]),
  // "HH:MM" 24h in GMT (Ghana time); both null = any time of day.
  withdrawalStartTime: varchar("withdrawal_start_time", { length: 5 }),
  withdrawalEndTime: varchar("withdrawal_end_time", { length: 5 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Site-wide launch date, shown as a "days in operation" banner to investors.
export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  launchDate: timestamp("launch_date").notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Which SMS notifications are sent to users; admin-controlled.
export const smsSettings = pgTable("sms_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationConfirmedEnabled: boolean("registration_confirmed_enabled")
    .notNull()
    .default(true),
  withdrawalRequestedEnabled: boolean("withdrawal_requested_enabled")
    .notNull()
    .default(true),
  withdrawalApprovedEnabled: boolean("withdrawal_approved_enabled")
    .notNull()
    .default(true),
  depositConfirmedEnabled: boolean("deposit_confirmed_enabled")
    .notNull()
    .default(true),
  referralRewardEnabled: boolean("referral_reward_enabled")
    .notNull()
    .default(true),
  suspiciousAdjustmentEnabled: boolean("suspicious_adjustment_enabled")
    .notNull()
    .default(true),
  packagePurchaseEnabled: boolean("package_purchase_enabled")
    .notNull()
    .default(true),
  // New chat message SMS'd to the other side when they're not currently
  // active on the site; deposit review SMS'd to adminAlertPhone.
  chatMessageEnabled: boolean("chat_message_enabled").notNull().default(true),
  depositReviewEnabled: boolean("deposit_review_enabled")
    .notNull()
    .default(true),
  // Where "needs admin attention" alerts go (new deposit, unclaimed/offline
  // chat message) when no specific admin is already handling it — a list so
  // more than one admin can be alerted.
  adminAlertPhone: varchar("admin_alert_phone", { length: 20 }),
  adminAlertPhones: jsonb("admin_alert_phones").$type<string[]>().notNull().default([]),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsBroadcastStatusEnum = pgEnum("sms_broadcast_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
]);

// One row per admin-initiated SMS broadcast, so send history/results can be
// reviewed later (target vs. sent vs. failed, timestamps, the message sent).
export const smsBroadcasts = pgTable("sms_broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  targetCount: integer("target_count").notNull(),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  status: smsBroadcastStatusEnum("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Admin-configurable gates on withdrawals by turn number (1st, 2nd, 3rd...).
// Several rows can share a turnNumber as alternative (OR) rules — a user
// only needs to satisfy ONE of the rules for that turn. minPackageId is the
// package whose minInvestmentGhs sets the tier floor: a direct invite
// "qualifies" for a rule if their own active package's minInvestmentGhs is
// at least that floor (packages have no explicit tier field, so price is
// used as the tier proxy, per how "packages" already work elsewhere).
export const withdrawalRequirements = pgTable("withdrawal_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  turnNumber: smallint("turn_number").notNull(),
  minDirectInvites: integer("min_direct_invites").notNull(),
  minPackageId: uuid("min_package_id")
    .notNull()
    .references(() => projects.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationTypeEnum = pgEnum("notification_type", [
  "chat_message",
  "deposit_submitted",
  "deposit_approved",
  "deposit_rejected",
  "withdrawal_requested",
  "withdrawal_approved",
  "withdrawal_rejected",
  "wallet_adjustment",
  "referral_reward",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    data: jsonb("data").$type<Record<string, string>>(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index("notifications_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
  }),
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
