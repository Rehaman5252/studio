
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";
import { QuizData as QuizDataSchema } from "@/ai/schemas";

export const dynamic = 'force_dynamic';

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Creates a structured JSON error response.
 * @param message - The error message.
 * @param status - The HTTP status code.
 * @param reqId - The request ID for tracing.
 * @param code - An optional error code.
 * @returns A NextResponse object.
 */
function createErrorResponse(message: string, status: number, reqId: string, code?: string) {
  return NextResponse.json(
    { ok: false, error: { code, message }, reqId },
    { status }
  );
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const body = await req.json().catch(() => null);

    const { format, userId } = body ?? {};
    const allowedFormats = ["mixed", "odi", "t20", "test", "ipl", "wpl"];

    if (!format || typeof format !== "string" || !allowedFormats.includes(format.toLowerCase())) {
      return createErrorResponse("Invalid or missing format", 400, reqId, "INVALID_FORMAT");
    }
    if (!userId || typeof userId !== 'string') {
      return createErrorResponse("Missing or invalid userId", 400, reqId, "INVALID_USERID");
    }

    try {
      console.info(`[quiz][${reqId}] Starting AI quiz generation for format=${format} user=${userId}`);
      const aiResult = await generateQuizFlow({ format, userId });

      // Use Zod's safeParse for robust validation
      const validation = QuizDataSchema.safeParse(aiResult);

      if (!validation.success) {
        console.warn(`[quiz][${reqId}] AI returned invalid quiz shape, using fallback.`, {
          error: validation.error.format(),
          aiSample: aiResult?.questions?.slice(0, 1),
        });
        throw new Error('AI returned an invalid quiz structure.');
      }

      console.info(`[quiz][${reqId}] AI generation succeeded.`);
      return NextResponse.json({ ok: true, quiz: validation.data, source: "ai", reqId });

    } catch (err: any) {
      console.error(`[quiz][${reqId}] AI generation failed, serving fallback. Error:`, err.message);
      
      const mappedError = mapFirestoreError(err);
      if (mappedError?.code === "INDEX_REQUIRED") {
        // If a required Firestore index is missing, it's a fatal server config issue.
        return createErrorResponse(mappedError.userMessage, 500, reqId, mappedError.code);
      }
      
      try {
        console.warn(`[quiz][${reqId}] Serving fallback quiz for format=${format}`);
        const fallbackQuiz = getFallbackQuiz(format);
        
        const fallbackResponsePayload: any = {
            ok: true,
            quiz: fallbackQuiz, 
            source: "fallback", 
            reqId,
        };
        
        // Add debug error info in development environments
        if (IS_DEV) {
            fallbackResponsePayload.error = { 
                message: "The AI is busy or failed, so here's a standard quiz instead.",
                details: err.message 
            };
        }

        return NextResponse.json(fallbackResponsePayload, { status: 200 });

      } catch (fallbackErr: any) {
        console.error(`[quiz][${reqId}] FATAL: Fallback quiz generation failed too.`, fallbackErr);
        return createErrorResponse(
          "We're sorry, but the quiz is currently unavailable. Please try again later.",
          500,
          reqId,
          "FALLBACK_FAILED"
        );
      }
    }
  } catch (globalError: any) {
    // Catches errors like invalid JSON in the request body.
    console.error(`[quiz][${reqId}] A critical unhandled error occurred in the API route.`, globalError);
    return createErrorResponse(
      "An internal server error occurred. Please try again.",
      500,
      reqId,
      "INTERNAL_SERVER_ERROR"
    );
  }
}
