
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow"; 
import { getFallbackQuiz } from "@/lib/fallback-quiz"; 
import { mapFirestoreError } from "@/lib/utils";

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
    console.error(`[quiz][${reqId}] API Error:`, err);
    
    // Map Firestore and other errors to user-friendly messages
    const userMessage = mapFirestoreError(err);
    
    // Fallback logic
    try {
        console.warn(`[quiz][${reqId}] AI failed, serving fallback for format=${format}`);
        const fallbackQuiz = getFallbackQuiz(format);
        return NextResponse.json({ 
            quiz: fallbackQuiz, 
            source: "fallback", 
            reqId,
            error: IS_DEV ? userMessage : "The AI is busy, here's a standard quiz." // Provide original error in dev
        }, { status: 200 });
    } catch (fbErr) {
        console.error(`[quiz][${reqId}] FATAL: Fallback failed too`, fbErr);
        // If even the fallback fails, send a final error response
        return NextResponse.json(
            { error: "We're sorry, but the quiz is currently unavailable. Please try again later.", reqId }, 
            { status: 500 }
        );
    }
  }
}
