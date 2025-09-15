
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";
import { QuizData as QuizDataSchema } from "@/ai/schemas";

export const dynamic = 'force_dynamic';

const IS_DEV = process.env.NODE_ENV !== "production";

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

      const validation = QuizDataSchema.safeParse(aiResult);

      if (!validation.success) {
        console.warn(`[quiz][${reqId}] AI returned invalid quiz shape, using fallback.`, {
          error: validation.error.format(),
          aiSample: JSON.stringify(aiResult)?.slice(0, 200),
        });
        throw new Error('AI returned an invalid quiz structure.');
      }

      console.info(`[quiz][${reqId}] AI generation succeeded.`);
      return NextResponse.json({ ok: true, quiz: validation.data, source: "ai", reqId });

    } catch (err: any) {
      console.error(`[quiz][${reqId}] AI generation failed, serving fallback. Error:`, err.message);
      
      const mappedError = mapFirestoreError(err);
      if (mappedError?.code === "INDEX_REQUIRED") {
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
        
        if (IS_DEV) {
            fallbackResponsePayload.errorDetails = { 
                message: "The AI is busy or failed, so here's a standard quiz instead.",
                originalError: err.message 
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
    console.error(`[quiz][${reqId}] A critical unhandled error occurred in the API route.`, globalError);
    return createErrorResponse(
      "An internal server error occurred. Please try again.",
      500,
      reqId,
      "INTERNAL_SERVER_ERROR"
    );
  }
}
