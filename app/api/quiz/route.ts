
import { NextResponse } from "next/server";

/**
 * Defensive quiz generation API route
 *
 * Behavior:
 * - Calls the AI generation flow (generateQuizFlow)
 * - Uses timeout + retry
 * - Validates AI response shape quickly
 * - On any error or invalid shape, returns a fallback quiz (source: "fallback")
 * - Always returns JSON with { quiz, source, reqId, error? }
 */

import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow"; 
import { getFallbackQuiz } from "@/lib/fallback-quiz"; 

// Configuration
const GENERATION_TIMEOUT = Number(process.env.GENERATION_TIMEOUT_MS ?? 15000); // ms
const MAX_RETRIES = Number(process.env.GENERATION_MAX_RETRIES ?? 1); // retries on transient AI errors
const IS_DEV = process.env.NODE_ENV !== "production";

// Quick structural validator for AI output — adjust to your expected shape
function isValidQuizShape(candidate: any): boolean {
  if (!candidate || typeof candidate !== "object") return false;
  if (!Array.isArray(candidate.questions)) return false;
  if (candidate.questions.length === 0) return false;
  // each question should have a question text and options array
  return candidate.questions.every((q: any) => {
    return typeof q?.question === "string" && Array.isArray(q?.options);
  });
}

function timeoutPromise<T>(ms: number, reason = "timeout") {
  return new Promise<never>((_, reject) => setTimeout(() => reject(new Error(reason)), ms));
}

async function callWithRetry(fn: () => Promise<any>, retries = 1) {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      attempt++;
      if (attempt > retries) break;
      // small backoff
      await new Promise((res) => setTimeout(res, 300 * attempt));
    }
  }
  throw lastErr;
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    console.error(`[quiz][${reqId}] invalid json body`, err);
    return NextResponse.json({ error: "Invalid JSON body", reqId }, { status: 400 });
  }

  const { format, userId, ...rest } = body ?? {};

  // simple input guard
  if (!format) {
    return NextResponse.json({ error: "Missing format", reqId }, { status: 400 });
  }

  // Wrapper that calls your generate flow with timeout
  const generate = async () => {
    // Run the AI generation with an enforced timeout
    const aiPromise = generateQuizFlow({ format, userId, ...rest });
    return await Promise.race([aiPromise, timeoutPromise(GENERATION_TIMEOUT, "ai_generation_timeout")]);
  };

  try {
    console.info(`[quiz][${reqId}] starting generation format=${format} user=${userId ?? "unknown"}`);

    const aiResult = await callWithRetry(generate, MAX_RETRIES);

    // Validate shape quickly
    if (!isValidQuizShape(aiResult)) {
      console.warn(`[quiz][${reqId}] AI returned invalid shape — falling back`, {
        aiSample: Array.isArray(aiResult?.questions) ? aiResult.questions.slice(0, 3) : undefined,
      });
      const fallback = getFallbackQuiz(format);
      return NextResponse.json({ quiz: fallback, source: "fallback", reqId, error: "ai_invalid_shape" }, { status: 200 });
    }

    console.info(`[quiz][${reqId}] AI generation succeeded`);
    return NextResponse.json({ quiz: aiResult, source: "ai", reqId }, { status: 200 });
  } catch (err: any) {
    // Any error -> fallback (log details)
    console.error(`[quiz][${reqId}] generation error:`, err?.message ?? err, {
      format,
      userId,
      timeoutMs: GENERATION_TIMEOUT,
    });

    // Provide the fallback quiz so client always receives valid JSON
    const fallback = getFallbackQuiz(format);
    const payload: any = { quiz: fallback, source: "fallback", reqId };

    // expose a short error string in DEV only to help triage quickly
    if (IS_DEV) payload.error = String(err?.message ?? err);

    return NextResponse.json(payload, { status: 200 });
  }
}
