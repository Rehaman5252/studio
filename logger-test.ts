
// To run this test script, you may need a tool like ts-node:
// npx ts-node logger-test.ts

import { logger } from "./app/lib/logger"; // Adjust path if you move this file
import { eventSchema } from "./app/lib/analytics-events";

console.log("--- Running Analytics Logger Test Script ---");

// --- Define Mock Payloads ---

const validQuizStart = {
  format: "T20",
  brand: "TestBrand",
  source: "ai" as const,
};

const validQuizComplete = {
  format: "T20",
  brand: "TestBrand",
  source: "ai" as const,
  score: 4,
  totalQuestions: 5,
  disqualified: false,
  reason: null,
};

const invalidQuizStart = {
  format: "T20",
  // ❌ Missing `brand` and `source`
};

const invalidQuizComplete = {
  format: "T20",
  brand: "TestBrand",
  source: "ai",
  score: "five", // ❌ Wrong type, should be number
  totalQuestions: 5,
  disqualified: false,
  reason: null,
};


// --- Running Tests ---

console.log("\n--- Testing Valid Events (Should Succeed) ---");
logger.event("quiz_start", validQuizStart);
logger.event("quiz_complete", validQuizComplete);


console.log("\n--- Testing Invalid Events (Should Show Validation Errors) ---");
try {
    logger.event("quiz_start", invalidQuizStart as any);
} catch (e) {
    // This catch block is just to prevent the script from crashing.
    // The logger itself will handle printing the validation error.
}

try {
    logger.event("quiz_complete", invalidQuizComplete as any);
} catch (e) {
    // This catch block is just to prevent the script from crashing.
}


console.log("\n--- Test Script Finished ---");
    