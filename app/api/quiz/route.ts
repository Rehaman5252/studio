
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";
import { ZodError } from "zod";

export const dynamic = 'force_dynamic';

const IS_DEV = process.env.NODE_ENV !== "production";

function createErrorResponse(message: string, reqId: string, status = 500, code?: string) {
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

  // The client will see a 200 OK and render the fallback quiz.
  // The actual error is logged on the server.
  return NextResponse.json(errorPayload, { status: 200 });
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  let body: any;
  try {
    const rawBody = await req.text();
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error(`[quiz][${reqId}] Invalid JSON body.`);
    return createErrorResponse("Invalid JSON body.", reqId, 400, "INVALID_JSON");
  }

  const { format, userId } = body ?? {};
  const allowedFormats = ["mixed", "odi", "t20", "test", "ipl", "wpl"];

  if (!format || typeof format !== "string" || !allowedFormats.includes(format.toLowerCase())) {
    console.warn(`[quiz][${reqId}] Invalid format requested: ${format}`);
    return createErrorResponse("Invalid or missing format. Defaulting to fallback.", reqId, 400, "INVALID_FORMAT");
  }
  if (!userId || typeof userId !== 'string') {
    console.warn(`[quiz][${reqId}] Missing or invalid userId.`);
    return createErrorResponse("Missing or invalid userId. Defaulting to fallback.", reqId, 400, "INVALID_USERID");
  }

  try {
    console.info(`[quiz][${reqId}] Starting AI quiz generation for format=${format} user=${userId}`);
    
    const aiResult = await generateQuizFlow({ format, userId });
    
    // The flow itself now has robust validation with `safeParse`.
    // If it throws, it will be caught by the outer catch block.
    
    console.info(`[quiz][${reqId}] AI generation succeeded.`);
    return NextResponse.json({ ok: true, quiz: aiResult, source: "ai", reqId });

  } catch (err: any) {
    console.error(`[quiz][${reqId}] AI generation failed, serving fallback. Error:`, err.message);
    
    // Handle specific Firestore errors that are user-fixable (like missing indexes)
    const mappedError = mapFirestoreError(err);
    if (mappedError?.code === "INDEX_REQUIRED") {
      return NextResponse.json({
        ok: false, // This is a real error the client needs to know about
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
}
