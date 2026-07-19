// Calling code + expected local significant-number length per country.
export const PHONE_RULES: Record<string, { callingCode: string; digits: number }> = {
  GH: { callingCode: "233", digits: 9 },
  NG: { callingCode: "234", digits: 10 },
  KE: { callingCode: "254", digits: 9 },
  ZA: { callingCode: "27", digits: 9 },
  UG: { callingCode: "256", digits: 9 },
  TZ: { callingCode: "255", digits: 9 },
  RW: { callingCode: "250", digits: 9 },
  CI: { callingCode: "225", digits: 10 },
  SN: { callingCode: "221", digits: 9 },
  ET: { callingCode: "251", digits: 9 },
  EG: { callingCode: "20", digits: 10 },
  MA: { callingCode: "212", digits: 9 },
  ZM: { callingCode: "260", digits: 9 },
  ZW: { callingCode: "263", digits: 9 },
  CM: { callingCode: "237", digits: 9 },
  GM: { callingCode: "220", digits: 7 },
  SL: { callingCode: "232", digits: 8 },
  LR: { callingCode: "231", digits: 8 },
};

export interface PhoneValidation {
  valid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Validates a phone number against the expected calling code and digit
 * count for the given country, accepting "+233...", "233...", or local
 * "0..." input. Returns the normalized E.164-style value on success.
 */
export function validatePhoneForCountry(
  countryCode: string,
  rawNumber: string,
): PhoneValidation {
  const rule = PHONE_RULES[countryCode];
  if (!rule) {
    return { valid: false, formatted: rawNumber, error: "Unsupported country" };
  }

  const digitsOnly = rawNumber.replace(/[^\d]/g, "");
  let national = digitsOnly;

  if (digitsOnly.startsWith(rule.callingCode)) {
    national = digitsOnly.slice(rule.callingCode.length);
  } else if (digitsOnly.startsWith("0")) {
    national = digitsOnly.slice(1);
  }

  if (national.length !== rule.digits) {
    return {
      valid: false,
      formatted: rawNumber,
      error: `Enter a valid number for +${rule.callingCode} (${rule.digits} digits after the country code)`,
    };
  }

  return { valid: true, formatted: `+${rule.callingCode}${national}` };
}
