process.env.MOBILE_HMAC_SECRET = "test-hmac-secret-key";
process.env.MOBILE_TIMESTAMP_WINDOW_SECONDS = "300";
process.env.MOBILE_JWT_SECRET = "test-jwt-secret-key";
process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = "3600";

import { describe, it } from "node:test";
import { expect } from "chai";
import crypto from "crypto";
import { registerMobileUser } from "@/mobile/register";
import { MobileAuthError } from "@/mobile/exchange";

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

describe("registerMobileUser", () => {
  describe("TIMESTAMP_EXPIRED", () => {
    it("throws MobileAuthError with code TIMESTAMP_EXPIRED when timestamp is stale", async () => {
      const email = "newuser@example.com";
      const staleTimestamp = nowSec() - 600;
      const signature = sign(email, staleTimestamp);

      try {
        await registerMobileUser(email, staleTimestamp, signature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("TIMESTAMP_EXPIRED");
      }
    });

    it("throws TIMESTAMP_EXPIRED for a future timestamp beyond the window", async () => {
      const email = "newuser@example.com";
      const futureTimestamp = nowSec() + 600;
      const signature = sign(email, futureTimestamp);

      try {
        await registerMobileUser(email, futureTimestamp, signature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("TIMESTAMP_EXPIRED");
      }
    });
  });

  describe("INVALID_SIGNATURE", () => {
    it("throws MobileAuthError with code INVALID_SIGNATURE when signature is wrong", async () => {
      const email = "newuser@example.com";
      const timestamp = nowSec();
      const badSignature = "0".repeat(64);

      try {
        await registerMobileUser(email, timestamp, badSignature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("INVALID_SIGNATURE");
      }
    });

    it("throws INVALID_SIGNATURE when email was tampered", async () => {
      const realEmail = "newuser@example.com";
      const tamperedEmail = "attacker@example.com";
      const timestamp = nowSec();
      const signature = sign(tamperedEmail, timestamp);

      try {
        await registerMobileUser(realEmail, timestamp, signature);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("INVALID_SIGNATURE");
      }
    });

    it("throws INVALID_SIGNATURE for wrong-length signature", async () => {
      const email = "newuser@example.com";
      const timestamp = nowSec();
      const shortSig = "deadbeef";

      try {
        await registerMobileUser(email, timestamp, shortSig);
        expect.fail("Expected MobileAuthError to be thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(MobileAuthError);
        expect((error as MobileAuthError).code).to.equal("INVALID_SIGNATURE");
      }
    });
  });

  // NOTE: USER_ALREADY_EXISTS test requires a running database or integration test setup
  // because findMobileUserByEmail queries Prisma directly and ESM module mocking
  // is not available in this environment.
});
