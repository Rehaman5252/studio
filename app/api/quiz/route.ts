
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

  try {
    console.info(`[quiz][${reqId}] starting generation format=${format} user=${userId}`);
    const aiResult = await generateQuizFlow({ format, userId });

    if (!isValidQuizShape(aiResult)) {
      console.warn(`[quiz][${reqId}] AI returned invalid shape`, {
        aiSample: aiResult?.questions?.slice(0, 1),
      });
      throw new Error('AI returned an invalid quiz structure.');
    }

    console.info(`[quiz][${reqId}] AI generation succeeded`);
    return NextResponse.json({ quiz: aiResult, source: "ai", reqId }, { status: 200 });

  } catch (err: any) {
    console.error(`[quiz][${reqId}] AI generation failed:`, err?.message ?? err);

    const errorMessage = IS_DEV ? (err?.message ?? 'AI quiz generation failed.') : 'The AI quiz master is busy. Please try again in a moment.';
    
    // Do not serve a fallback. Return an error to the client.
    return NextResponse.json(
        { error: errorMessage, reqId }, 
        { status: 500 }
    );
  }
}
