
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";
import { z, ZodError } from "zod";
import type { QuizData } from "@/ai/schemas";

export const dynamic = 'force_dynamic';

const IS_DEV = process.env.NODE_ENV !== "production";

const ApiQuizInputSchema = z.object({
  format: z.enum(["mixed", "odi", "t20", "test", "ipl", "wpl"]),
  userId: z.string().min(1, { message: "User ID cannot be empty." }),
});

function createErrorResponse(
  message: string,
  format: string,
  reqId: string,
  code: string = "UNKNOWN"
) {
  const fallbackQuiz: QuizData = getFallbackQuiz(format || "mixed");
  return NextResponse.json({
    ok: true, // Always true so client can display fallback
    quiz: fallbackQuiz,
    source: "fallback",
    reqId,
    errorDetails: {
      message: `The AI quiz could not be generated (${code}). Showing a standard quiz instead.`,
      originalError: IS_DEV ? message : "Hidden in production",
      code,
    },
  });
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      console.error(`[quiz][${reqId}] Invalid JSON body.`);
      return createErrorResponse("Invalid JSON body", "mixed", reqId, "INVALID_JSON");
    }

    const parsed = ApiQuizInputSchema.safeParse(body);
    if (!parsed.success) {
      console.warn(`[quiz][${reqId}] Invalid payload:`, parsed.error.format());
      return createErrorResponse(
        JSON.stringify(parsed.error.format()),
        "mixed",
        reqId,
        "INVALID_PAYLOAD"
      );
    }

    const { format, userId } = parsed.data;

    try {
      console.info(`[quiz][${reqId}] Generating AI quiz for ${userId} (${format})`);
      const quiz = await generateQuizFlow({ format, userId });
      return NextResponse.json({ ok: true, quiz, source: "ai", reqId });
    } catch (err: any) {
      console.error(`[quiz][${reqId}] AI flow failed:`, IS_DEV ? err : err.message);

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

      return createErrorResponse(
        err instanceof ZodError ? JSON.stringify(err.format()) : err.message,
        format,
        reqId,
        "AI_FLOW_FAILED"
      );
    }
  } catch (fatal: any) {
    // This catches *anything* not already handled
    console.error(`[quiz][${reqId}] Fatal API error:`, fatal);
    return createErrorResponse(
      fatal?.message || "Unknown fatal error",
      "mixed",
      reqId,
      "FATAL"
    );
  }
}
