import crypto from "crypto";

const getHmacSecret = (): string => {
  const secret = process.env.MOBILE_HMAC_SECRET;
  if (!secret) throw new Error("MOBILE_HMAC_SECRET is not configured");
  return secret;
};

const getTimestampWindow = (): number => {
  return parseInt(process.env.MOBILE_TIMESTAMP_WINDOW_SECONDS || "300", 10);
};

export function validateTimestamp(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - timestamp) <= getTimestampWindow();
}

export function verifySignature(email: string, timestamp: number, signature: string): boolean {
  const secret = getHmacSecret();
  const canonicalString = `${email}:${timestamp}`;
  const expected = crypto.createHmac("sha256", secret).update(canonicalString).digest("hex");

  if (expected.length !== signature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}
