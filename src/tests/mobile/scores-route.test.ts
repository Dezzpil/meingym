process.env.MOBILE_JWT_SECRET = "test-jwt-secret-key";
process.env.MOBILE_JWT_EXPIRES_IN_SECONDS = "3600";

import { describe, it, before, beforeEach, after, mock } from "node:test";
import { expect } from "chai";
import { NextRequest } from "next/server";

// ─── Dynamic module references ─────────────────────────────────────────
let POST: (request: NextRequest) => Promise<Response>;

let verifyMobileTokenImpl: (token: string) => Promise<{ userId: string } | null>;
let calculateTrainingScoresImpl: (...args: any[]) => Promise<any>;

const USER_ID = "user-123";
const VALID_TOKEN = "valid-token";

// класс ошибки, который роут распознаёт как 400
class MobileScoresInputErrorStub extends Error {}

function resetMocks() {
  verifyMobileTokenImpl = async () => ({ userId: USER_ID });
  calculateTrainingScoresImpl = async () => ({
    timeScoreInMins: 0,
    timeScoreInSecs: 0,
    difficultyScore: 0,
    exercises: [],
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────
function buildPostRequest(body: unknown, authHeader?: string): NextRequest {
  const headers = new Headers();
  headers.set("content-type", "application/json");
  if (authHeader) headers.set("authorization", authHeader);

  return new NextRequest("https://example.com/api/mobile/v1/trainings/scores", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeExercise(overrides?: Record<string, unknown>) {
  return {
    id: 42,
    purpose: "MASS",
    approaches: [
      { weight: 60, count: 10 },
      { weight: 70, count: 8 },
    ],
    ...overrides,
  };
}

// ─── Module mocks ──────────────────────────────────────────────────────
describe("/api/mobile/v1/trainings/scores", () => {
  before(async () => {
    resetMocks();

    (mock as any).module("@/mobile/tools/jwt", {
      namedExports: {
        verifyMobileToken: (token: string) => verifyMobileTokenImpl(token),
      },
    });

    (mock as any).module("@/mobile/scores", {
      namedExports: {
        calculateTrainingScores: (...args: any[]) =>
          calculateTrainingScoresImpl(...args),
        MobileScoresInputError: MobileScoresInputErrorStub,
        MAX_EXERCISES_PER_REQUEST: 50,
      },
    });

    const mod = await import("@/app/api/mobile/v1/trainings/scores/route");
    POST = mod.POST;
  });

  beforeEach(() => {
    resetMocks();
  });

  after(() => {
    mock.restoreAll();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Авторизация
  // ═══════════════════════════════════════════════════════════════════════
  describe("auth", () => {
    it("returns 401 when authorization header is missing", async () => {
      const response = await POST(buildPostRequest({ exercises: [makeExercise()] }));

      expect(response.status).to.equal(401);
      const body = await response.json();
      expect(body.error).to.equal("Authorization header with Bearer token is required");
    });

    it("returns 401 when authorization header is not Bearer", async () => {
      const response = await POST(
        buildPostRequest({ exercises: [makeExercise()] }, "Basic dXNlcjpwYXNz"),
      );

      expect(response.status).to.equal(401);
      const body = await response.json();
      expect(body.error).to.equal("Authorization header with Bearer token is required");
    });

    it("returns 401 when token is invalid or expired", async () => {
      verifyMobileTokenImpl = async () => null;

      const response = await POST(
        buildPostRequest({ exercises: [makeExercise()] }, `Bearer ${VALID_TOKEN}`),
      );

      expect(response.status).to.equal(401);
      const body = await response.json();
      expect(body.error).to.equal("Invalid or expired token");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Валидация тела запроса
  // ═══════════════════════════════════════════════════════════════════════
  describe("validation", () => {
    async function postBody(body: unknown) {
      const response = await POST(buildPostRequest(body, `Bearer ${VALID_TOKEN}`));
      return { status: response.status, body: await response.json() };
    }

    it("returns 400 when body is not valid JSON", async () => {
      const { status, body } = await postBody("{ not json");

      expect(status).to.equal(400);
      expect(body.error).to.equal("Request body must contain an 'exercises' array");
    });

    it("returns 400 when body does not contain an exercises array", async () => {
      const { status, body } = await postBody({ foo: "bar" });

      expect(status).to.equal(400);
      expect(body.error).to.equal("Request body must contain an 'exercises' array");
    });

    it("returns 400 when exercises array is empty", async () => {
      const { status, body } = await postBody({ exercises: [] });

      expect(status).to.equal(400);
      expect(body.error).to.equal("exercises array must not be empty");
    });

    it("returns 413 when exercises array exceeds the limit", async () => {
      const exercises = Array.from({ length: 51 }, (_, i) => makeExercise({ id: i + 1 }));

      const { status, body } = await postBody({ exercises });

      expect(status).to.equal(413);
      expect(body.error).to.equal("Maximum 50 exercises per request");
    });

    it("returns 400 when exercise id is not a positive integer", async () => {
      const { status, body } = await postBody({ exercises: [makeExercise({ id: 0 })] });

      expect(status).to.equal(400);
      expect(body.error).to.match(/^exercises\[0\]\.id:/);
    });

    it("returns 400 when purpose is unknown", async () => {
      const { status, body } = await postBody({
        exercises: [makeExercise({ purpose: "CARDIO" })],
      });

      expect(status).to.equal(400);
      expect(body.error).to.match(/^exercises\[0\]\.purpose:/);
    });

    it("returns 400 when approaches array is empty", async () => {
      const { status, body } = await postBody({
        exercises: [makeExercise({ approaches: [] })],
      });

      expect(status).to.equal(400);
      expect(body.error).to.match(/^exercises\[0\]\.approaches:/);
    });

    it("returns 400 when approach weight is negative", async () => {
      const { status, body } = await postBody({
        exercises: [makeExercise({ approaches: [{ weight: -1, count: 10 }] })],
      });

      expect(status).to.equal(400);
      expect(body.error).to.match(/^exercises\[0\]\.approaches\[0\]\.weight:/);
    });

    it("returns 400 when approach count is not a positive integer", async () => {
      const { status, body } = await postBody({
        exercises: [makeExercise({ approaches: [{ weight: 60, count: 0 }] })],
      });

      expect(status).to.equal(400);
      expect(body.error).to.match(/^exercises\[0\]\.approaches\[0\]\.count:/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Расчёт
  // ═══════════════════════════════════════════════════════════════════════
  describe("scoring", () => {
    it("passes userId and validated exercises to the service", async () => {
      const scores = {
        timeScoreInMins: 7,
        timeScoreInSecs: 420,
        difficultyScore: 8.93,
        exercises: [
          {
            id: 42,
            purpose: "MASS",
            approachesCount: 2,
            timeScoreInMins: 7,
            timeScoreInSecs: 420,
            difficultyScore: 8.93,
          },
        ],
      };

      let capturedUserId: string | undefined;
      let capturedExercises: unknown[] | undefined;

      calculateTrainingScoresImpl = async (userId: string, exercises: unknown[]) => {
        capturedUserId = userId;
        capturedExercises = exercises;
        return scores;
      };

      const exercise = makeExercise();
      const response = await POST(
        buildPostRequest({ exercises: [exercise] }, `Bearer ${VALID_TOKEN}`),
      );

      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body).to.deep.equal(scores);

      expect(capturedUserId).to.equal(USER_ID);
      expect(capturedExercises).to.deep.equal([exercise]);
    });

    it("returns 400 when the service reports invalid input", async () => {
      calculateTrainingScoresImpl = async () => {
        throw new MobileScoresInputErrorStub("Unknown exercise ids: 42");
      };

      const response = await POST(
        buildPostRequest({ exercises: [makeExercise()] }, `Bearer ${VALID_TOKEN}`),
      );

      expect(response.status).to.equal(400);
      const body = await response.json();
      expect(body.error).to.equal("Unknown exercise ids: 42");
    });

    it("returns 500 when the service throws an unexpected error", async () => {
      calculateTrainingScoresImpl = async () => {
        throw new Error("database unreachable");
      };

      const response = await POST(
        buildPostRequest({ exercises: [makeExercise()] }, `Bearer ${VALID_TOKEN}`),
      );

      expect(response.status).to.equal(500);
      const body = await response.json();
      expect(body.error).to.equal("Internal server error");
    });
  });
});
