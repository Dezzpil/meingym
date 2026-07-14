import { validateTimestamp, verifySignature } from "@/mobile/tools/hmac";
import { findMobileUserByEmail, createMobileUser } from "@/mobile/tools/user";
import { createMobileToken } from "@/mobile/tools/jwt";
import { MobileAuthError } from "@/mobile/exchange";

export async function registerMobileUser(
  email: string,
  timestamp: number,
  signature: string,
  name?: string
): Promise<{ token: string; expiresIn: number; userId: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!validateTimestamp(timestamp)) {
    throw new MobileAuthError("TIMESTAMP_EXPIRED");
  }

  if (!verifySignature(normalizedEmail, timestamp, signature)) {
    throw new MobileAuthError("INVALID_SIGNATURE");
  }

  const existing = await findMobileUserByEmail(normalizedEmail);
  if (existing) {
    throw new MobileAuthError("USER_ALREADY_EXISTS");
  }

  const user = await createMobileUser(normalizedEmail, name);
  const { token, expiresIn } = await createMobileToken(user.id);

  return { token, expiresIn, userId: user.id };
}
