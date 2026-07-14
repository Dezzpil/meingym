process.env.MOBILE_HMAC_SECRET = "test-hmac-secret-key";
process.env.MOBILE_TIMESTAMP_WINDOW_SECONDS = "300";

import { describe, it } from "node:test";
import { expect } from "chai";
import crypto from "crypto";
import { validateTimestamp, verifySignature } from "@/mobile/tools/hmac";

const SECRET = "test-hmac-secret-key";

function sign(email: string, timestamp: number): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${email}:${timestamp}`)
    .digest("hex");
}

describe("validateTimestamp", () => {
  it("returns true for current timestamp", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(validateTimestamp(now)).to.equal(true);
  });

  it("returns false for timestamp older than the window", () => {
    const now = Math.floor(Date.now() / 1000);
    // 600 seconds ago, window is 300s → should fail
    expect(validateTimestamp(now - 600)).to.equal(false);
  });

  it("returns false for future timestamp beyond the window", () => {
    const now = Math.floor(Date.now() / 1000);
    // 600 seconds in the future, window is 300s → should fail
    expect(validateTimestamp(now + 600)).to.equal(false);
  });

  it("returns true for timestamp just inside the window", () => {
    const now = Math.floor(Date.now() / 1000);
    // 299 seconds ago, within 300s window → should pass
    expect(validateTimestamp(now - 299)).to.equal(true);
  });
});

describe("verifySignature", () => {
  const email = "user@example.com";
  const timestamp = Math.floor(Date.now() / 1000);

  it("returns true for a valid HMAC-SHA256 signature", () => {
    const validSig = sign(email, timestamp);
    expect(verifySignature(email, timestamp, validSig)).to.equal(true);
  });

  it("returns false for an invalid signature (same length)", () => {
    // 64-char hex string of all zeros — valid hex but wrong HMAC value
    const invalidSig = "0".repeat(64);
    expect(verifySignature(email, timestamp, invalidSig)).to.equal(false);
  });

  it("returns false for a tampered email", () => {
    const validSig = sign(email, timestamp);
    // Verify with a different email → should fail
    expect(verifySignature("attacker@example.com", timestamp, validSig)).to.equal(false);
  });

  it("returns false for a wrong-length signature", () => {
    const shortSig = "abc123";
    expect(verifySignature(email, timestamp, shortSig)).to.equal(false);
  });

  it("returns false when signature is a hex string but with odd chars padded to wrong length", () => {
    const wrongLenSig = "ab".repeat(20); // 40 chars, expected 64
    expect(verifySignature(email, timestamp, wrongLenSig)).to.equal(false);
  });
});
