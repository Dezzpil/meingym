process.env.MOBILE_JWT_SECRET = "test-jwt-secret-key";
process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = "3600";

import { describe, it, before, beforeEach, after, mock } from "node:test";
import { expect } from "chai";
import { NextRequest } from "next/server";

// ─── Dynamic module references ─────────────────────────────────────────
let GET: (request: NextRequest) => Promise<Response>;
let POST: (request: NextRequest) => Promise<Response>;

let verifyMobileTokenImpl: (token: string) => Promise<{ userId: string } | null>;
let getTrainingsListImpl: (...args: any[]) => Promise<any>;
let syncTrainingsBatchImpl: (...args: any[]) => Promise<any[]>;

const USER_ID = "user-123";
const VALID_TOKEN = "valid-token";

function resetMocks() {
  verifyMobileTokenImpl = async () => ({ userId: USER_ID });
  getTrainingsListImpl = async () => ({
    meta: { total: 0, nextCursor: null },
    items: [],
  });
  syncTrainingsBatchImpl = async () => [];
}

// ─── Helpers ───────────────────────────────────────────────────────────
function buildGetRequest(
  params?: { cursor?: string; since?: string },
  authHeader?: string,
): NextRequest {
  const url = new URL("https://example.com/api/mobile/v1/trainings");
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);
  if (params?.since) url.searchParams.set("since", params.since);

  const headers = new Headers();
  if (authHeader) headers.set("authorization", authHeader);

  return new NextRequest(url, { headers });
}

function buildPostRequest(body: unknown, authHeader?: string): NextRequest {
  const headers = new Headers();
  headers.set("content-type", "application/json");
  if (authHeader) headers.set("authorization", authHeader);

  return new NextRequest("https://example.com/api/mobile/v1/trainings", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// ─── Module mocks ──────────────────────────────────────────────────────
describe("/api/mobile/v1/trainings", () => {
  before(async () => {
    resetMocks();

    (mock as any).module("@/mobile/tools/jwt", {
      namedExports: {
        verifyMobileToken: (token: string) => verifyMobileTokenImpl(token),
      },
    });

    (mock as any).module("@/mobile/trainings", {
      namedExports: {
        getTrainingsList: (...args: any[]) => getTrainingsListImpl(...args),
      },
    });

    (mock as any).module("@/mobile/syncTrainings", {
      namedExports: {
        syncTrainingsBatch: (...args: any[]) => syncTrainingsBatchImpl(...args),
        MAX_BATCH_SIZE: 20,
      },
    });

    const mod = await import("@/app/api/mobile/v1/trainings/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  beforeEach(() => {
    resetMocks();
  });

  after(() => {
    mock.restoreAll();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // GET
  // ═══════════════════════════════════════════════════════════════════════
  describe("GET", () => {
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

    it("returns 400 when since is older than one month", async () => {
      const tooOld = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString();
      const request = buildGetRequest({ since: tooOld }, `Bearer ${VALID_TOKEN}`);
      const response = await GET(request);

      expect(response.status).to.equal(400);
      const body = await response.json();
      expect(body.error).to.equal("since must not be older than 1 month");
    });

    it("returns 200 and default since to one month ago when omitted", async () => {
      let capturedUserId: string | undefined;
      let capturedSince: Date | undefined;
      let capturedCursor: number | undefined;

      getTrainingsListImpl = async (userId: string, since: Date, cursor?: number) => {
        capturedUserId = userId;
        capturedSince = since;
        capturedCursor = cursor;
        return { meta: { total: 1, nextCursor: null }, items: [] };
      };

      const request = buildGetRequest({}, `Bearer ${VALID_TOKEN}`);
      const response = await GET(request);

      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.meta.total).to.equal(1);

      expect(capturedUserId).to.equal(USER_ID);
      expect(capturedCursor).to.be.undefined;

      const oneMonthAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
      expect(capturedSince).to.be.instanceOf(Date);
      expect(capturedSince!.getTime()).to.be.closeTo(oneMonthAgo, 1000);
    });

    it("passes cursor and since to getTrainingsList", async () => {
      let capturedCursor: number | undefined;
      let capturedSince: Date | undefined;

      getTrainingsListImpl = async (_userId: string, since: Date, cursor?: number) => {
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
  });

  // ═══════════════════════════════════════════════════════════════════════
  // POST
  // ═══════════════════════════════════════════════════════════════════════
  describe("POST", () => {
    it("returns 401 when authorization header is missing", async () => {
      const request = buildPostRequest({ trainings: [] });
      const response = await POST(request);

      expect(response.status).to.equal(401);
      const body = await response.json();
      expect(body.error).to.equal("Authorization header with Bearer token is required");
    });

    it("returns 401 when token is invalid or expired", async () => {
      verifyMobileTokenImpl = async () => null;

      const request = buildPostRequest({ trainings: [] }, `Bearer ${VALID_TOKEN}`);
      const response = await POST(request);

      expect(response.status).to.equal(401);
      const body = await response.json();
      expect(body.error).to.equal("Invalid or expired token");
    });

    it("returns 400 when body does not contain a trainings array", async () => {
      const request = buildPostRequest({ foo: "bar" }, `Bearer ${VALID_TOKEN}`);
      const response = await POST(request);

      expect(response.status).to.equal(400);
      const body = await response.json();
      expect(body.error).to.equal("Request body must contain a 'trainings' array");
    });

    it("returns 400 when trainings array is empty", async () => {
      const request = buildPostRequest({ trainings: [] }, `Bearer ${VALID_TOKEN}`);
      const response = await POST(request);

      expect(response.status).to.equal(400);
      const body = await response.json();
      expect(body.error).to.equal("trainings array must not be empty");
    });

    it("returns 413 when trainings array exceeds MAX_BATCH_SIZE", async () => {
      const trainings = Array.from({ length: 21 }, (_, i) => ({
        externalId: `ext-${i}`,
        plannedTo: new Date().toISOString(),
        exercises: [],
      }));

      const request = buildPostRequest({ trainings }, `Bearer ${VALID_TOKEN}`);
      const response = await POST(request);

      expect(response.status).to.equal(413);
      const body = await response.json();
      expect(body.error).to.equal("Maximum 20 trainings per request");
    });

    it("returns 200 and results from syncTrainingsBatch", async () => {
      const inputTraining = {
        externalId: "ext-001",
        plannedTo: new Date().toISOString(),
        exercises: [],
      };

      let capturedUserId: string | undefined;
      let capturedTrainings: unknown[] | undefined;

      syncTrainingsBatchImpl = async (userId: string, trainings: unknown[]) => {
        capturedUserId = userId;
        capturedTrainings = trainings;
        return [{ externalId: "ext-001", status: "created", trainingId: 1 }];
      };

      const request = buildPostRequest({ trainings: [inputTraining] }, `Bearer ${VALID_TOKEN}`);
      const response = await POST(request);

      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.results).to.deep.equal([
        { externalId: "ext-001", status: "created", trainingId: 1 },
      ]);

      expect(capturedUserId).to.equal(USER_ID);
      expect(capturedTrainings).to.deep.equal([inputTraining]);
    });

    it("returns 500 when syncTrainingsBatch throws an unexpected error", async () => {
      syncTrainingsBatchImpl = async () => {
        throw new Error("database unreachable");
      };

      const request = buildPostRequest(
        {
          trainings: [
            {
              externalId: "ext-001",
              plannedTo: new Date().toISOString(),
              exercises: [],
            },
          ],
        },
        `Bearer ${VALID_TOKEN}`,
      );
      const response = await POST(request);

      expect(response.status).to.equal(500);
      const body = await response.json();
      expect(body.error).to.equal("Internal server error");
    });
  });
});
