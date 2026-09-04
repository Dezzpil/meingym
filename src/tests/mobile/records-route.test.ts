process.env.MOBILE_JWT_SECRET = "test-jwt-secret-key";
process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = "3600";

import { describe, it, before, beforeEach, after, mock } from "node:test";
import { expect } from "chai";
import { NextRequest } from "next/server";

// ─── Dynamic module references ─────────────────────────────────────────
let GET: (request: NextRequest) => Promise<Response>;

let verifyMobileTokenImpl: (token: string) => Promise<{ userId: string } | null>;
let getRecordsListImpl: (...args: any[]) => Promise<any>;

const USER_ID = "user-123";
const VALID_TOKEN = "valid-token";

function resetMocks() {
  verifyMobileTokenImpl = async () => ({ userId: USER_ID });
  getRecordsListImpl = async () => ({
    meta: { total: 0, nextCursor: null },
    items: [],
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────
function buildGetRequest(
  params?: { cursor?: string; since?: string },
  authHeader?: string,
): NextRequest {
  const url = new URL("https://example.com/api/mobile/v1/records");
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);
  if (params?.since) url.searchParams.set("since", params.since);

  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);

  return new NextRequest(url, { headers });
}

// ─── Module mocks ──────────────────────────────────────────────────────
describe("/api/mobile/v1/records", () => {
  before(async () => {
    resetMocks();

    (mock as any).module("@/mobile/tools/jwt", {
      namedExports: {
        verifyMobileToken: (token: string) => verifyMobileTokenImpl(token),
      },
    });

    (mock as any).module("@/mobile/records", {
      namedExports: {
        getRecordsList: (...args: any[]) => getRecordsListImpl(...args),
      },
    });

    const mod = await import("@/app/api/mobile/v1/records/route");
    GET = mod.GET;
  });

  beforeEach(() => {
    resetMocks();
  });

  after(() => {
    mock.restoreAll();
  });

  it("returns 401 when authorization header is missing", async () => {
    const request = buildGetRequest();
    const response = await GET(request);

    expect(response.status).to.equal(401);
    const body = await response.json();
    expect(body.error).to.equal("Authorization header with Bearer token is required");
  });

  it("returns 401 when authorization header is not Bearer", async () => {
    const request = buildGetRequest({}, "Basic dXNlcjpwYXNz");
    const response = await GET(request);

    expect(response.status).to.equal(401);
    const body = await response.json();
    expect(body.error).to.equal("Authorization header with Bearer token is required");
  });

  it("returns 401 when token is invalid or expired", async () => {
    verifyMobileTokenImpl = async () => null;

    const request = buildGetRequest({}, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(401);
    const body = await response.json();
    expect(body.error).to.equal("Invalid or expired token");
  });

  it("returns 400 when cursor is not a positive integer", async () => {
    const request = buildGetRequest({ cursor: "abc" }, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(400);
    const body = await response.json();
    expect(body.error).to.equal("cursor must be a positive integer");
  });

  it("returns 400 when cursor is negative", async () => {
    const request = buildGetRequest({ cursor: "-1" }, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(400);
    const body = await response.json();
    expect(body.error).to.equal("cursor must be a positive integer");
  });

  it("returns 400 when since is not a valid ISO 8601 datetime", async () => {
    const request = buildGetRequest({ since: "not-a-date" }, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(400);
    const body = await response.json();
    expect(body.error).to.equal("since must be a valid ISO 8601 datetime");
  });

  it("defaults since to one month ago when omitted", async () => {
    let capturedUserId: string | undefined;
    let capturedSince: Date | undefined;
    let capturedCursor: number | undefined;

    getRecordsListImpl = async (userId: string, since: Date, cursor?: number) => {
      capturedUserId = userId;
      capturedSince = since;
      capturedCursor = cursor;
      return { meta: { total: 2, nextCursor: null }, items: [] };
    };

    const request = buildGetRequest({}, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(200);
    const body = await response.json();
    expect(body.meta.total).to.equal(2);

    expect(capturedUserId).to.equal(USER_ID);
    expect(capturedCursor).to.be.undefined;

    const oneMonthAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    expect(capturedSince).to.be.instanceOf(Date);
    expect(capturedSince!.getTime()).to.be.closeTo(oneMonthAgo, 1000);
  });

  it("passes cursor and since to getRecordsList", async () => {
    let capturedCursor: number | undefined;
    let capturedSince: Date | undefined;

    getRecordsListImpl = async (_userId: string, since: Date, cursor?: number) => {
      capturedSince = since;
      capturedCursor = cursor;
      return { meta: { total: 0, nextCursor: null }, items: [] };
    };

    const sinceIso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const request = buildGetRequest({ cursor: "42", since: sinceIso }, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(200);
    expect(capturedCursor).to.equal(42);
    expect(capturedSince).to.deep.equal(new Date(sinceIso));
  });

  it("accepts since older than one month — records are valuable on the whole history", async () => {
    let capturedSince: Date | undefined;

    getRecordsListImpl = async (_userId: string, since: Date) => {
      capturedSince = since;
      return { meta: { total: 0, nextCursor: null }, items: [] };
    };

    const request = buildGetRequest(
      { since: "2020-01-01T00:00:00.000Z" },
      `Bearer ${VALID_TOKEN}`,
    );
    const response = await GET(request);

    expect(response.status).to.equal(200);
    expect(capturedSince).to.deep.equal(new Date("2020-01-01T00:00:00.000Z"));
  });

  it("returns records from getRecordsList as is", async () => {
    const payload = {
      meta: { total: 1, nextCursor: null },
      items: [
        {
          id: 5,
          actionId: 42,
          purpose: "MASS",
          type: "MAX_WEIGHT",
          isAllTime: true,
          value: 100,
          reps: 5,
          periodId: null,
          trainingId: 10,
          trainingExerciseId: 100,
          achievedAt: "2026-08-01T10:00:00.000Z",
          previousValue: 95,
          previousTrainingId: 9,
          previousAt: "2026-07-01T10:00:00.000Z",
          createdAt: "2026-08-01T12:00:00.000Z",
        },
      ],
    };
    getRecordsListImpl = async () => payload;

    const request = buildGetRequest({}, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal(payload);
  });

  it("returns 500 when getRecordsList throws an unexpected error", async () => {
    getRecordsListImpl = async () => {
      throw new Error("database unreachable");
    };

    const request = buildGetRequest({}, `Bearer ${VALID_TOKEN}`);
    const response = await GET(request);

    expect(response.status).to.equal(500);
    const body = await response.json();
    expect(body.error).to.equal("Internal server error");
  });
});
