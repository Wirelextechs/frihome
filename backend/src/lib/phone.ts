const PHONE_RULES: Record<string, { callingCode: string; digits: number }> = {
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

export function isValidPhoneForCountry(
  countryCode: string,
  phone: string,
): boolean {
  const rule = PHONE_RULES[countryCode.toUpperCase()];
  if (!rule) return false;
  return new RegExp(`^\\+${rule.callingCode}\\d{${rule.digits}}$`).test(phone);
}
