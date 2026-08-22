export interface MoolreSmsResult {
  ok: boolean;
  error?: string;
}

export interface MoolreSmsMessage {
  recipient: string;
  message: string;
  ref?: string;
}

interface MoolreSmsResponseBody {
  status?: number;
  code?: string;
  message?: string;
}

async function callSmsApi(
  messages: MoolreSmsMessage[],
): Promise<MoolreSmsResult> {
  const vasKey = process.env.MOOLRE_SMS_VASKEY;
  const senderId = process.env.MOOLRE_SMS_SENDER_ID;

  if (!vasKey || !senderId) {
    return { ok: false, error: "SMS service is not configured" };
  }

  let response: Response;
  try {
    response = await fetch("https://api.moolre.com/open/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-VASKEY": vasKey,
      },
      body: JSON.stringify({
        type: 1,
        senderid: senderId,
        messages,
      }),
    });
  } catch (error) {
    console.error("Moolre SMS request failed:", error);
    return { ok: false, error: "SMS service is temporarily unavailable" };
  }

  const body = (await response.json().catch(() => null)) as MoolreSmsResponseBody | null;

  if (!response.ok || !body || body.status !== 1) {
    return {
      ok: false,
      error: body?.message ?? "Could not send SMS",
    };
  }

  return { ok: true };
}

export async function sendSms(
  recipient: string,
  message: string,
  ref?: string,
): Promise<MoolreSmsResult> {
  return callSmsApi([{ recipient, message, ref }]);
}

export async function sendBulkSms(
  messages: MoolreSmsMessage[],
): Promise<MoolreSmsResult> {
  if (messages.length === 0) {
    return { ok: false, error: "No messages to send" };
  }
  return callSmsApi(messages);
}

// Sends the same message to every number in the list (e.g. all configured
// admin alert numbers). No-ops quietly if the list is empty.
export async function sendSmsToMany(
  recipients: string[],
  message: string,
): Promise<MoolreSmsResult> {
  if (recipients.length === 0) {
    return { ok: true };
  }
  return sendBulkSms(recipients.map((recipient) => ({ recipient, message })));
}

export interface MoolreSmsBalanceResult {
  ok: boolean;
  balance?: number;
  error?: string;
}

export async function getSmsBalance(): Promise<MoolreSmsBalanceResult> {
  const vasKey = process.env.MOOLRE_SMS_VASKEY;
  if (!vasKey) {
    return { ok: false, error: "SMS service is not configured" };
  }

  let response: Response;
  try {
    response = await fetch("https://api.moolre.com/open/sms/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-VASKEY": vasKey,
      },
      body: JSON.stringify({ type: 2 }),
    });
  } catch (error) {
    console.error("Moolre SMS balance request failed:", error);
    return { ok: false, error: "SMS service is temporarily unavailable" };
  }

  const body = (await response.json().catch(() => null)) as {
    status?: number;
    message?: string;
    data?: { balance?: number };
  } | null;

  if (!response.ok || !body || body.status !== 1) {
    return { ok: false, error: body?.message ?? "Could not fetch SMS balance" };
  }

  return { ok: true, balance: body.data?.balance ?? 0 };
}

// GSM SMS is 160 chars per segment; longer messages split into multiple
// segments, each consuming a separate credit.
export function estimateSmsSegments(message: string): number {
  return Math.max(1, Math.ceil(message.length / 160));
}
