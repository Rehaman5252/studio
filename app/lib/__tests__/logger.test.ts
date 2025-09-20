import { logger } from "../logger";

describe("Logger Event Validation", () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    // Set to a non-production value to ensure dev-style logging for tests
    process.env.NODE_ENV = "development"; 
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    // Spy on console methods to check if they are called correctly
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs a valid quiz_start event using the generic log method", () => {
    const payload = { format: "T20", brand: "TestBrand", source: "ai" as const };
    logger.event("quiz_start", payload);
    expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining("[EVENT] quiz_start"), 
        payload
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs a validation error for an invalid quiz_start event", () => {
    const badPayload = { format: "T20" } as any; // Missing brand and source
    logger.event("quiz_start", badPayload);
    // It should call the 'error' log level with a validation failure message
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[EVENT VALIDATION FAILED] for event "quiz_start":'),
      expect.any(Object)
    );
    // It should NOT log a successful event
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
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[EVENT] quiz_complete"), payload);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs a validation error for an invalid quiz_complete event", () => {
    const badPayload = {
      format: "T20",
      brand: "TestBrand",
      source: "ai",
      score: "five", // Incorrect type
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
