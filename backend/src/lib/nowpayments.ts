import crypto from "node:crypto";

const API_BASE = "https://api.nowpayments.io/v1";

// Static indicative rate until a live FX feed is wired up.
const GHS_PER_USD = 12.8;

export interface CreatePaymentResult {
  ok: boolean;
  paymentId?: string;
  payAddress?: string;
  payAmount?: string;
  payCurrency?: string;
  error?: string;
}

export async function createCryptoPayment(
  userId: string,
  amountGhs: number,
): Promise<CreatePaymentResult> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  const callbackUrl = process.env.NOWPAYMENTS_IPN_CALLBACK_URL;
  if (!apiKey || !callbackUrl) {
    return { ok: false, error: "Crypto payments are not configured" };
  }

  const priceAmountUsd = Number((amountGhs / GHS_PER_USD).toFixed(2));

  const response = await fetch(`${API_BASE}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      price_amount: priceAmountUsd,
      price_currency: "usd",
      pay_currency: "usdttrc20",
      order_id: `${userId}-${Date.now()}`,
      order_description: "AfriHome wallet top-up",
      ipn_callback_url: callbackUrl,
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    payment_id?: number | string;
    pay_address?: string;
    pay_amount?: number | string;
    pay_currency?: string;
    message?: string;
  } | null;

  if (!response.ok || !body?.payment_id) {
    return {
      ok: false,
      error: body?.message ?? "Could not create crypto payment",
    };
  }

  return {
    ok: true,
    paymentId: String(body.payment_id),
    payAddress: body.pay_address,
    payAmount: String(body.pay_amount),
    payCurrency: body.pay_currency,
  };
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function sortObject(obj: JsonValue): JsonValue {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject((obj as Record<string, JsonValue>)[key]);
        return acc;
      }, {} as Record<string, JsonValue>);
  }
  return obj;
}

export function verifyIpnSignature(
  payload: JsonValue,
  signature: string | undefined,
): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;
  const sorted = sortObject(payload);
  const digest = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(sorted))
    .digest("hex");
  return digest === signature;
}
