
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { z, ZodError } from "zod";
import type { QuizData } from "@/ai/schemas";

export const dynamic = 'force_dynamic';

const ApiQuizInputSchema = z.object({
  format: z.enum(["mixed", "odi", "t20", "test", "ipl", "wpl"]),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});

type ErrorCodes = "INVALID_JSON" | "INVALID_PAYLOAD" | "AI_FLOW_FAILED" | "FATAL";

const sendErrorResponse = (
  reqId: string,
  code: ErrorCodes,
  originalError: string,
  fallbackQuiz: QuizData
) => {
    let friendlyMessage = "The AI is currently busy. Here's a standard quiz to get you started!";
    
    return NextResponse.json({
        ok: true, // Still OK because we have a fallback
        quiz: fallbackQuiz,
        source: "fallback",
        reqId: reqId,
        error: { message: friendlyMessage },
        errorDetails: {
            message: friendlyMessage,
            originalError: originalError,
            code: code
        }
    });
};


export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let body;
  
  try {
    body = await req.json();
  } catch (e) {
    const err = e as Error;
    console.error(`[quiz][${reqId}] Invalid JSON`, err.message);
    const fallbackQuiz = getFallbackQuiz("mixed");
    return sendErrorResponse(reqId, "INVALID_JSON", err.message, fallbackQuiz);
  }

  try {
    const parsed = ApiQuizInputSchema.parse(body);
    const { format, userId } = parsed;

    try {
        console.info(`[quiz][${reqId}] Generating AI quiz for ${userId} (${format})`);
        const quiz = await generateQuizFlow({ format, userId });
        return NextResponse.json({ ok: true, quiz, source: "ai", reqId });

    } catch (aiError: any) {
        console.error(`[quiz][${reqId}] AI flow failed`, aiError.message);
        const fallbackQuiz = getFallbackQuiz(format);
        return sendErrorResponse(reqId, "AI_FLOW_FAILED", aiError.message, fallbackQuiz);
    }

  } catch (err: any) {
     if (err instanceof ZodError) {
        console.error(`[quiz][${reqId}] Invalid payload`, err.flatten());
        const fallbackQuiz = getFallbackQuiz(body?.format || "mixed");
        return sendErrorResponse(reqId, "INVALID_PAYLOAD", JSON.stringify(err.flatten()), fallbackQuiz);
     }
     
     console.error(`[quiz][${reqId}] Fatal API error`, err.message);
     const fallbackQuiz = getFallbackQuiz(body?.format || "mixed");
     return sendErrorResponse(reqId, "FATAL", err.message, fallbackQuiz);
  }
}
