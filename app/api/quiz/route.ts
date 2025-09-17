
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";
import { z, ZodError } from "zod";
import type { QuizData } from "@/ai/schemas";

export const dynamic = 'force_dynamic';

const ApiQuizInputSchema = z.object({
  format: z.enum(["mixed", "odi", "t20", "test", "ipl", "wpl"]),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});


export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const body = await req.json();
    const parsed = ApiQuizInputSchema.parse(body);
    const { format, userId } = parsed.data;

    console.info(`[quiz][${reqId}] Generating AI quiz for ${userId} (${format})`);
    
    // Directly call the AI flow. If it fails, the error will propagate
    // and result in a 500 server error, as requested.
    const quiz = await generateQuizFlow({ format, userId });
    
    return NextResponse.json({ ok: true, quiz, source: "ai", reqId });

  } catch (err: any) {
    console.error(`[quiz][${reqId}] Fatal API error:`, err);
    
    // Map Firestore index errors to a specific, actionable response.
    const mapped = mapFirestoreError(err);
    if (mapped?.code === "INDEX_REQUIRED") {
      return NextResponse.json(
        {
          ok: false,
          error: { code: mapped.code, message: mapped.userMessage },
          reqId,
        },
        { status: 500 }
      );
    }
    
    // For all other errors (Zod validation, AI flow failure, etc.), return a generic 500 error.
    const errorMessage = err instanceof ZodError 
      ? "Invalid request payload." 
      : err.message || "Failed to generate AI quiz.";

    return NextResponse.json(
      { ok: false, error: { message: errorMessage }, reqId },
      { status: 500 }
    );
  }
}
