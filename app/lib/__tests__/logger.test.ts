
import { logger } from "../logger";

describe("Logger Event Validation", () => {
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "development"; // force logging for tests
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv; // restore original NODE_ENV
  });

  beforeEach(() => {
    infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs a valid quiz_start event", () => {
    const payload = { format: "T20", brand: "TestBrand", source: "ai" as const };
    logger.event("quiz_start", payload);
    expect(logSpy).toHaveBeenCalledWith("[EVENT] quiz_start", payload);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs a validation error for an invalid quiz_start event", () => {
    const badPayload = { format: "T20" } as any;
    logger.event("quiz_start", badPayload);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[EVENT VALIDATION FAILED] for event "quiz_start":'),
      expect.any(Object)
    );
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("logs a valid quiz_complete event", () => {
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
    expect(logSpy).toHaveBeenCalledWith("[EVENT] quiz_complete", payload);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs a validation error for an invalid quiz_complete event", () => {
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
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[EVENT VALIDATION FAILED] for event "quiz_complete":'),
      expect.any(Object)
    );
     expect(logSpy).not.toHaveBeenCalled();
  });
});
