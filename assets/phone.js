export function normalizePhone(value) {
  if (typeof value !== "string") return "";
  const phone = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(phone)) return "";
  let digits = phone.replace(/\D/g, "");
  if (!phone.startsWith("+")) {
    if (digits.length === 10) digits = "7" + digits;
    else if (/^[78]\d{10}$/.test(digits)) digits = "7" + digits.slice(1);
    else return "";
  }
  if (!/^[1-9]\d{7,14}$/.test(digits)) return "";
  if (digits.startsWith("7") && !/^7[3-9]\d{9}$/.test(digits)) return "";
  if (/^(\d)\1+$/.test(digits.slice(1))) return "";
  return "+" + digits;
}
