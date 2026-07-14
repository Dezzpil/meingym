import { validateTimestamp, verifySignature } from "@/mobile/tools/hmac";
import { findMobileUserByEmail } from "@/mobile/tools/user";
import { createMobileToken } from "@/mobile/tools/jwt";

export class MobileAuthError extends Error {
  constructor(public code: "TIMESTAMP_EXPIRED" | "INVALID_SIGNATURE" | "USER_NOT_FOUND" | "USER_ALREADY_EXISTS") {
    super(code);
    this.name = "MobileAuthError";
  }
}

export async function exchangeForToken(
  email: string,
  timestamp: number,
  signature: string
): Promise<{ token: string; expiresIn: number }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!validateTimestamp(timestamp)) {
    throw new MobileAuthError("TIMESTAMP_EXPIRED");
  }

  if (!verifySignature(normalizedEmail, timestamp, signature)) {
    throw new MobileAuthError("INVALID_SIGNATURE");
  }

  const user = await findMobileUserByEmail(normalizedEmail);
  if (!user) {
    throw new MobileAuthError("USER_NOT_FOUND");
  }

  return createMobileToken(user.id);
}
