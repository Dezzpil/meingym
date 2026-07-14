process.env.MOBILE_JWT_SECRET = "test-jwt-secret-key";
process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = "3600";

import { describe, it } from "node:test";
import { expect } from "chai";
import { createMobileToken, verifyMobileToken } from "@/mobile/tools/jwt";

describe("createMobileToken", () => {
  it("returns an object with a valid JWT string and expiresIn number", async () => {
    const result = await createMobileToken("user-123");

    expect(result).to.have.property("token").that.is.a("string");
    expect(result).to.have.property("expiresIn").that.is.a("number");
    expect(result.token).to.not.be.empty;
    expect(result.expiresIn).to.equal(3600);
    // JWT has three parts separated by dots
    expect(result.token.split(".")).to.have.lengthOf(3);
  });
});

describe("verifyMobileToken", () => {
  it("successfully verifies a token created by createMobileToken", async () => {
    const { token } = await createMobileToken("user-456");
    const result = await verifyMobileToken(token);

    expect(result).to.not.be.null;
  });

  it("returns the correct userId from the token", async () => {
    const userId = "user-abc-123";
    const { token } = await createMobileToken(userId);
    const result = await verifyMobileToken(token);

    expect(result).to.not.be.null;
    expect(result!.userId).to.equal(userId);
  });

  it("returns null for a tampered/invalid token", async () => {
    const { token } = await createMobileToken("user-789");
    // Flip a character in the signature portion to simulate tampering
    const tampered = token.slice(0, -4) + "AAAA";
    const result = await verifyMobileToken(tampered);

    expect(result).to.be.null;
  });

  it("returns null for a completely malformed token", async () => {
    const result = await verifyMobileToken("not.a.jwt");
    expect(result).to.be.null;
  });

  it("returns null for an expired token", async () => {
    // Override expiry to 1 second for this test
    const originalExpiry = process.env.MOBILE_JWT_EXPIRES_IN_SECONDS;
    process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = "1";

    try {
      const { token } = await createMobileToken("user-expired");
      // Wait 2 seconds to ensure the token is expired
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await verifyMobileToken(token);
      expect(result).to.be.null;
    } finally {
      process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = originalExpiry;
    }
  });
});
