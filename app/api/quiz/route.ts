
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";

export const dynamic = 'force_dynamic';

const IS_DEV = process.env.NODE_ENV !== "production";

function isValidQuizShape(candidate: any): boolean {
  if (!candidate || typeof candidate !== "object") return false;
  if (!Array.isArray(candidate.questions) || candidate.questions.length !== 5) return false;

  return candidate.questions.every((q: any) =>
    typeof q?.question === "string" && q.question.length > 0 &&
    Array.isArray(q?.options) && q.options.length === 4 &&
    q.options.every((opt: any) => typeof opt === 'string' && opt.length > 0) &&
    typeof q?.correctAnswer === 'string' && q.options.includes(q.correctAnswer) &&
    typeof q?.explanation === 'string' && q.explanation.length > 0
  );
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      console.error(`[quiz][${reqId}] invalid json body`, err);
      return NextResponse.json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON body" }, reqId }, { status: 400 });
    }

    const { format, userId } = body ?? {};
    const allowedFormats = ["mixed", "odi", "t20", "test", "ipl", "wpl"];

    if (!format || typeof format !== "string" || !allowedFormats.includes(format.toLowerCase())) {
      return NextResponse.json({ ok: false, error: { code: "INVALID_FORMAT", message: "Invalid or missing format" }, reqId }, { status: 400 });
    }
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ ok: false, error: { code: "INVALID_USERID", message: "Missing or invalid userId" }, reqId }, { status: 400 });
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
      return NextResponse.json({ ok: true, quiz: aiResult, source: "ai", reqId }, { status: 200 });

    } catch (err: any) {
      console.error(`[quiz][${reqId}] API Error during quiz generation:`, err);
      
      const mappedError = mapFirestoreError(err);
      
      if (mappedError && mappedError.code === "INDEX_REQUIRED") {
          return NextResponse.json({ ok: false, error: mappedError, reqId }, { status: 500 });
      }
      
      try {
          console.warn(`[quiz][${reqId}] AI failed, serving fallback for format=${format}`);
          const fallbackQuiz = getFallbackQuiz(format);
          return NextResponse.json({ 
              ok: true,
              quiz: fallbackQuiz, 
              source: "fallback", 
              reqId,
              error: IS_DEV ? mappedError?.userMessage : "The AI is busy, here's a standard quiz."
          }, { status: 200 });
      } catch (fallbackErr) {
          console.error(`[quiz][${reqId}] FATAL: Fallback failed too`, fallbackErr);
          return NextResponse.json(
              { ok: false, error: { code: "FALLBACK_FAILED", message: "We're sorry, but the quiz is currently unavailable. Please try again later." } }, 
              { status: 500 }
          );
      }
    }
  } catch (globalError: any) {
    console.error(`[quiz][${reqId}] FATAL API error:`, globalError);
    return NextResponse.json(
        { ok: false, error: { code: "INTERNAL_SERVER_ERROR", message: "A critical server error occurred. Please try again." } }, 
        { status: 500 }
    );
  }
}
