
import { NextResponse } from "next/server";
import { generateQuizFlow } from "@/ai/flows/generate-quiz-flow";
import { getFallbackQuiz } from "@/lib/fallback-quiz";
import { mapFirestoreError } from "@/lib/utils";
import { ZodError } from "zod";

export const dynamic = 'force_dynamic';

const IS_DEV = process.env.NODE_ENV !== "production";

function createErrorResponse(message: string, reqId: string, status = 500, code?: string) {
  const fallbackQuiz = getFallbackQuiz("mixed");
  const errorPayload: any = {
    ok: true,
    quiz: fallbackQuiz,
    source: "fallback",
    reqId,
    errorDetails: {
      message: `The AI quiz could not be generated (${code || 'UNKNOWN'}). Displaying a standard quiz instead.`,
      originalError: IS_DEV ? message : "Error details hidden in production.",
    },
  };

  return new Response(JSON.stringify(errorPayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let body: any;

  try {
    const rawBody = await req.text();
    if (!rawBody) {
        console.warn(`[quiz][${reqId}] Empty request body`);
        return createErrorResponse("Empty request body.", reqId, 400, "EMPTY_BODY");
    }
    body = JSON.parse(rawBody);
  } catch (e) {
    console.error(`[quiz][${reqId}] Invalid JSON body.`);
    return createErrorResponse("Invalid JSON body.", reqId, 400, "INVALID_JSON");
  }

  const { format, userId } = body ?? {};
  const allowedFormats = ["mixed", "odi", "t20", "test", "ipl", "wpl"];

  if (!format || typeof format !== "string" || !allowedFormats.includes(format.toLowerCase())) {
    console.warn(`[quiz][${reqId}] Invalid format requested: ${format}`);
    return createErrorResponse("Invalid or missing format.", reqId, 400, "INVALID_FORMAT");
  }
  if (!userId || typeof userId !== 'string') {
    console.warn(`[quiz][${reqId}] Missing or invalid userId.`);
    return createErrorResponse("Missing or invalid userId.", reqId, 400, "INVALID_USERID");
  }

  try {
    console.info(`[quiz][${reqId}] Starting AI quiz generation for format=${format} user=${userId}`);
    
    const aiResult = await generateQuizFlow({ format, userId });
    
    console.info(`[quiz][${reqId}] AI generation succeeded.`);
    return NextResponse.json({ ok: true, quiz: aiResult, source: "ai", reqId });

  } catch (err: any) {
    console.error(`[quiz][${reqId}] AI generation failed, serving fallback. Error:`, err.message);
    
    const mappedError = mapFirestoreError(err);
    if (mappedError?.code === "INDEX_REQUIRED") {
      return NextResponse.json({
        ok: false, 
        error: { code: mappedError.code, message: mappedError.userMessage },
        reqId
      }, { status: 500 });
    }
    
    return createErrorResponse(
        err instanceof ZodError ? JSON.stringify(err.format()) : err.message,
        reqId,
        500,
        "AI_FLOW_FAILED"
    );
  }
}
