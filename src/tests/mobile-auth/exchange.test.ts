process.env.MOBILE_HMAC_SECRET = "test-hmac-secret-key";
process.env.MOBILE_TIMESTAMP_WINDOW_SECONDS = "300";
process.env.MOBILE_JWT_SECRET = "test-jwt-secret-key";
process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = "3600";

import { describe, it } from "node:test";
import { expect } from "chai";
import crypto from "crypto";
import { exchangeForToken, MobileAuthError } from "@/mobile/exchange";

const SECRET = "test-hmac-secret-key";

function sign(email: string, timestamp: number): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${email}:${timestamp}`)
    .digest("hex");
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

describe("exchangeForToken", () => {
  describe("TIMESTAMP_EXPIRED", () => {
    it("throws MobileAuthError with code TIMESTAMP_EXPIRED when timestamp is stale", async () => {
      const email = "user@example.com";
      const staleTimestamp = nowSec() - 600; // 600s ago, window is 300s
      const signature = sign(email, staleTimestamp);

      try {
        await exchangeForToken(email, staleTimestamp, signature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("TIMESTAMP_EXPIRED");
      }
    });

    it("throws TIMESTAMP_EXPIRED for a future timestamp beyond the window", async () => {
      const email = "user@example.com";
      const futureTimestamp = nowSec() + 600;
      const signature = sign(email, futureTimestamp);

      try {
        await exchangeForToken(email, futureTimestamp, signature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("TIMESTAMP_EXPIRED");
      }
    });
  });

  describe("INVALID_SIGNATURE", () => {
    it("throws MobileAuthError with code INVALID_SIGNATURE when signature is wrong", async () => {
      const email = "user@example.com";
      const timestamp = nowSec();
      const badSignature = "0".repeat(64); // correct length but wrong value

      try {
        await exchangeForToken(email, timestamp, badSignature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("INVALID_SIGNATURE");
      }
    });

    it("throws INVALID_SIGNATURE when email was tampered (different email used for signing)", async () => {
      const realEmail = "user@example.com";
      const tamperedEmail = "attacker@example.com";
      const timestamp = nowSec();
      // Sign with the tampered email but pass the real email
      const signature = sign(tamperedEmail, timestamp);

      try {
        await exchangeForToken(realEmail, timestamp, signature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("INVALID_SIGNATURE");
      }
    });
  });

  // NOTE: USER_NOT_FOUND test requires a running database or integration test setup
  // because findMobileUserByEmail queries Prisma directly and ESM module mocking
  // is not available in this environment.
});
