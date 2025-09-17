
import { logger } from "../logger";
import { eventSchema } from "../analytics-events";

describe("logger.event()", () => {
  const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
  const spyError = jest.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    // Set NODE_ENV to development for these tests to ensure logs appear
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    spyLog.mockClear();
    spyError.mockClear();
  });

  afterAll(() => {
    spyLog.mockRestore();
    spyError.mockRestore();
    // Reset NODE_ENV
    process.env.NODE_ENV = 'test';
  });

  it("logs valid quiz_start event", () => {
    const payload = {
      format: "T20",
      brand: "TestBrand",
      source: "ai" as const,
    };

    logger.event("quiz_start", payload);

    expect(spyLog).toHaveBeenCalledWith("[EVENT] quiz_start", payload);
    expect(spyError).not.toHaveBeenCalled();
  });

  it("logs valid quiz_complete event", () => {
    const payload = {
      format: "T20",
      brand: "TestBrand",
      source: "ai" as const,
      score: 4,
      totalQuestions: 5,
      disqualified: false,
      reason: null,
    };

    logger.event("quiz_complete", payload);

    expect(spyLog).toHaveBeenCalledWith("[EVENT] quiz_complete", payload);
    expect(spyError).not.toHaveBeenCalled();
  });

  it("rejects invalid quiz_start event and logs a validation error", () => {
    const badPayload = {
      format: "T20",
      // ❌ missing brand and source
    } as any;

    logger.event("quiz_start", badPayload);

    expect(spyError).toHaveBeenCalledWith(
      '[EVENT VALIDATION FAILED] for event "quiz_start":',
      expect.any(Object)
    );
    expect(spyLog).not.toHaveBeenCalled();
  });

  it("rejects invalid quiz_complete event and logs a validation error", () => {
    const badPayload = {
      format: "T20",
      brand: "TestBrand",
      source: "ai",
      score: "five", // ❌ wrong type
      totalQuestions: 5,
      disqualified: false,
      reason: null,
    } as any;

    logger.event("quiz_complete", badPayload);

    expect(spyError).toHaveBeenCalledWith(
      '[EVENT VALIDATION FAILED] for event "quiz_complete":',
      expect.any(Object)
    );
    expect(spyLog).not.toHaveBeenCalled();
  });

  it("does not log events in production environment", () => {
    process.env.NODE_ENV = 'production';
    const payload = {
      format: "T20",
      brand: "TestBrand",
      source: "ai" as const,
    };
    logger.event("quiz_start", payload);
    expect(spyLog).not.toHaveBeenCalled();
    expect(spyError).not.toHaveBeenCalled();
  });
});
