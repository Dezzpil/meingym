import { SignJWT, jwtVerify } from "jose";

const getSecret = () => {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) throw new Error("MOBILE_JWT_SECRET is not configured");
  return new TextEncoder().encode(secret);
};

const getExpiresIn = (): number => {
  return parseInt(process.env.MOBILE_JWT_EXPIRES_IN_SECONDS || "3600", 10);
};

export async function createMobileToken(userId: string): Promise<{ token: string; expiresIn: number }> {
  const expiresIn = getExpiresIn();
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(getSecret());
  return { token, expiresIn };
}

export async function verifyMobileToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
