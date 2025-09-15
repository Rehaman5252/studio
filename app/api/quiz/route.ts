
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";
import { QuizData as QuizDataSchema } from "@/ai/schemas";
import { ZodError } from "zod";

export const dynamic = 'force_dynamic';

const IS_DEV = process.env.NODE_ENV !== "production";

function createErrorResponse(message: string, status: number, reqId: string, code?: string) {
  // Always return a fallback quiz on error to ensure app functionality.
  const fallbackQuiz = getFallbackQuiz("mixed");
  const errorPayload: any = {
    ok: true, // Send ok: true so client can render fallback
    quiz: fallbackQuiz,
    source: "fallback",
    reqId,
    errorDetails: {
      message: `The AI quiz could not be generated (${code || 'UNKNOWN'}). Displaying a standard quiz instead.`,
      originalError: message,
    },
  };

  return NextResponse.json(errorPayload, { status: 200 });
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return createErrorResponse("Invalid JSON body.", 400, reqId, "INVALID_JSON");
  }

  try {
    const { format, userId } = body ?? {};
    const allowedFormats = ["mixed", "odi", "t20", "test", "ipl", "wpl"];

    if (!format || typeof format !== "string" || !allowedFormats.includes(format.toLowerCase())) {
      return createErrorResponse("Invalid or missing format. Defaulting to fallback.", 400, reqId, "INVALID_FORMAT");
    }
    if (!userId || typeof userId !== 'string') {
      return createErrorResponse("Missing or invalid userId. Defaulting to fallback.", 400, reqId, "INVALID_USERID");
    }

    try {
      console.info(`[quiz][${reqId}] Starting AI quiz generation for format=${format} user=${userId}`);
      
      const aiResult = await generateQuizFlow({ format, userId });
      
      // The flow itself now has robust validation with `safeParse`.
      // If it throws, it will be caught by the outer catch block.
      // This successful return means the data is valid.
      
      console.info(`[quiz][${reqId}] AI generation succeeded.`);
      return NextResponse.json({ ok: true, quiz: aiResult, source: "ai", reqId });

    } catch (err: any) {
      console.error(`[quiz][${reqId}] AI generation failed, serving fallback. Error:`, err.message);
      
      // Handle specific Firestore errors that are user-fixable (like missing indexes)
      const mappedError = mapFirestoreError(err);
      if (mappedError?.code === "INDEX_REQUIRED") {
        return NextResponse.json({
          ok: false,
          error: { code: mappedError.code, message: mappedError.userMessage },
          reqId
        }, { status: 500 });
      }
      
      // For all other errors, serve the fallback quiz
      const fallbackQuiz = getFallbackQuiz(format);
      const fallbackResponsePayload: any = {
          ok: true, // OK for the client to proceed with this data
          quiz: fallbackQuiz, 
          source: "fallback", 
          reqId,
      };
      
      if (IS_DEV) {
          fallbackResponsePayload.errorDetails = { 
              message: "The AI is busy or failed, so here's a standard quiz instead.",
              originalError: err instanceof ZodError ? err.format() : err.message,
          };
      }

      return NextResponse.json(fallbackResponsePayload, { status: 200 });
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
