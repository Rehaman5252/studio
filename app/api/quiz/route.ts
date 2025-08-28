
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow"; 
import { getFallbackQuiz } from "@/lib/fallback-quiz"; 

const GENERATION_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2; // Increased retries for more resilience
const IS_DEV = process.env.NODE_ENV !== "production";

function isValidQuizShape(candidate: any): boolean {
  if (!candidate || typeof candidate !== "object") return false;
  if (!Array.isArray(candidate.questions) || candidate.questions.length !== 5) return false;
  return candidate.questions.every((q: any) => 
    typeof q?.question === "string" && 
    Array.isArray(q?.options) && 
    q.options.length === 4 &&
    typeof q?.correctAnswer === 'string' &&
    typeof q?.explanation === 'string'
  );
}

function timeoutPromise<T>(ms: number, reason = "timeout") {
  return new Promise<T>((_, reject) => setTimeout(() => reject(new Error(reason)), ms));
}

async function callWithRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        throw error;
      }
      console.warn(`[quiz] Attempt ${attempt} failed, retrying...`);
      await new Promise(res => setTimeout(res, 500 * attempt));
    }
  }
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

  const { format, userId } = body ?? {};

  if (!format || !userId) {
    return NextResponse.json({ error: "Missing format or userId", reqId }, { status: 400 });
  }

  const generate = () => {
    const aiPromise = generateQuizFlow({ format, userId });
    return Promise.race([aiPromise, timeoutPromise(GENERATION_TIMEOUT_MS, "ai_generation_timeout")]);
  };

  try {
    console.info(`[quiz][${reqId}] starting generation format=${format} user=${userId}`);
    const aiResult = await callWithRetry(generate, MAX_RETRIES);

    if (!isValidQuizShape(aiResult)) {
      console.warn(`[quiz][${reqId}] AI returned invalid shape — falling back`, {
        aiSample: aiResult?.questions?.slice(0, 1),
      });
      throw new Error('ai_invalid_shape');
    }

    console.info(`[quiz][${reqId}] AI generation succeeded`);
    return NextResponse.json({ quiz: aiResult, source: "ai", reqId }, { status: 200 });

  } catch (err: any) {
    console.error(`[quiz][${reqId}] generation error, using fallback:`, err?.message ?? err);

    const fallback = getFallbackQuiz(format);
    const payload: any = { quiz: fallback, source: "fallback", reqId };

    if (IS_DEV) payload.error = String(err?.message ?? err);

    // Always return 200 with a valid quiz structure
    return NextResponse.json(payload, { status: 200 });
  }
}
