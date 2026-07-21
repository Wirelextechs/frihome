const MOMO_CHANNELS: Record<string, number> = {
  mtn: 1,
  telecel: 6,
  vodafone: 6, // Vodafone Cash was rebranded to Telecel Cash
  airteltigo: 7,
};

const BANK_CHANNEL = 2;

export interface MoolreValidateResult {
  ok: boolean;
  name?: string;
  error?: string;
}

async function validate(params: {
  receiver: string;
  channel: number;
  sublistid?: string;
}): Promise<MoolreValidateResult> {
  const apiUser = process.env.MOOLRE_API_USER;
  const apiKey = process.env.MOOLRE_API_KEY;
  const accountNumber = process.env.MOOLRE_ACCOUNT_NUMBER;

  if (!apiUser || !apiKey || !accountNumber) {
    return { ok: false, error: "Name verification is not configured" };
  }

  let response: Response;
  try {
    response = await fetch("https://api.moolre.com/open/transact/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-USER": apiUser,
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        type: 1,
        receiver: params.receiver,
        channel: params.channel,
        sublistid: params.sublistid,
        currency: "GHS",
        accountnumber: accountNumber,
      }),
    });
  } catch (error) {
    console.error("Moolre validate request failed:", error);
    return { ok: false, error: "Verification service is temporarily unavailable" };
  }

  const body = (await response.json().catch(() => null)) as {
    status?: number;
    message?: string;
    data?: string;
  } | null;

  if (!response.ok || !body || body.status !== 1) {
    return {
      ok: false,
      error: body?.message ?? "Could not verify this account",
    };
  }

  return { ok: true, name: body.data };
}

export async function validateMomoName(
  phoneNumber: string,
  network: string,
): Promise<MoolreValidateResult> {
  const channel = MOMO_CHANNELS[network.toLowerCase()];
  if (!channel) {
    return { ok: false, error: "Unsupported mobile money network" };
  }
  return validate({ receiver: phoneNumber, channel });
}

export async function validateBankAccountName(
  accountNumber: string,
  bankCode: string,
): Promise<MoolreValidateResult> {
  return validate({
    receiver: accountNumber,
    channel: BANK_CHANNEL,
    sublistid: bankCode,
  });
}

export interface MoolreBank {
  code: string;
  name: string;
}

export async function getGhanaBanks(): Promise<MoolreBank[]> {
  let response: Response;
  try {
    response = await fetch(
      "https://api.moolre.com/open/transact/data?country=gha&data=banks",
    );
  } catch (error) {
    console.error("Moolre banks request failed:", error);
    return [];
  }

  const body = (await response.json().catch(() => null)) as {
    status?: string | number;
    data?: MoolreBank[];
  } | null;

  if (!response.ok || !body || String(body.status) !== "1" || !body.data) {
    return [];
  }
  return body.data;
}
