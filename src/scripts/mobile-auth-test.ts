import dotenv from "dotenv";

import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { inspect } from "node:util";

dotenv.config({
  path: ".env",
});

let host = "127.0.0.1";
if (process.env.NODE_ENV === "development") {
  host = "meingym.online";
}

const email = process.argv[2];
if (!email) {
  throw new Error("Email is required");
}
console.log(`Email: ${email}`);

const emailNorm = email.trim().toLowerCase();
const timestamp = Math.floor(Date.now() / 1000);
const canonicalString = `${emailNorm}:${timestamp}`;

const hmacSecret = process.env.MOBILE_HMAC_SECRET;
if (!hmacSecret) {
  throw new Error("MOBILE_HMAC_SECRET is not set");
}

const signature = crypto
  .createHmac("sha256", hmacSecret)
  .update(canonicalString)
  .digest("hex");

const payload = {
  email: emailNorm,
  timestamp,
  signature,
};
const cmd = `curl -k -X POST https://${host}/api/mobile/v1/auth/exchange \
  -H "Content-Type: application/json" \
  -d '${JSON.stringify(payload)}'`;
console.log(cmd);

try {
  const out = execSync(cmd);
  console.log(inspect(out.toString()));
  console.log("---");

  const { token, expiresIn } = JSON.parse(out.toString());
  const cmdMe = `curl -k https://${host}/api/mobile/v1/me \
  -H "Authorization: Bearer ${token}"`;
  console.log(cmdMe);

  const outMe = execSync(cmdMe);
  console.log(inspect(JSON.parse(outMe.toString())));
  console.log("---");

  const cmdEs = `curl -k https://${host}/api/mobile/v1/exercises \
  -H "Authorization: Bearer ${token}"`;
  console.log(cmdEs);

  const outEs = execSync(cmdEs);
  console.log(inspect(JSON.parse(outEs.toString())));
} catch (e) {
  console.error(e);
  process.exit(1);
}
