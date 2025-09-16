
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

function createErrorResponse(message: string, reqId: string, status = 500, code?: string) {
  const fallbackQuiz: QuizData = getFallbackQuiz("mixed");
  const errorPayload = {
    ok: true, // Always true so client can display fallback
    quiz: fallbackQuiz,
    source: "fallback" as const,
    reqId,
    errorDetails: {
      message: `The AI quiz could not be generated (${code || 'UNKNOWN'}). Displaying a standard quiz instead.`,
      originalError: IS_DEV ? message : "Error details hidden in production.",
    },
  };

  return new Response(JSON.stringify(errorPayload), {
    status: 200, // Return 200 so the client can parse the fallback
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let body: any;

  try {
    body = await req.json();
  } catch (e) {
    console.error(`[quiz][${reqId}] Invalid JSON body.`);
    return createErrorResponse("Invalid JSON body.", reqId, 400, "INVALID_JSON");
  }

  const validationResult = ApiQuizInputSchema.safeParse(body);

  if (!validationResult.success) {
    const formattedErrors = validationResult.error.format();
    console.warn(`[quiz][${reqId}] Invalid request body:`, formattedErrors);
    return createErrorResponse(JSON.stringify(formattedErrors), reqId, 400, "INVALID_PAYLOAD");
  }

  const { format, userId } = validationResult.data;

  try {
    console.info(`[quiz][${reqId}] Starting AI quiz generation for format=${format} user=${userId}`);
    
    const aiResult = await generateQuizFlow({ format, userId });
    
    console.info(`[quiz][${reqId}] AI generation succeeded.`);
    return NextResponse.json({ ok: true, quiz: aiResult, source: "ai", reqId });

  } catch (err: any) {
    console.error(`[quiz][${reqId}] AI generation failed, serving fallback. Error:`, err.message);
    
    const mappedError = mapFirestoreError(err);
    if (mappedError?.code === "INDEX_REQUIRED") {
      // This is a fatal configuration error, so we return a 500 to the client
      return NextResponse.json({
        ok: false, 
        error: { code: mappedError.code, message: mappedError.userMessage },
        reqId
      }, { status: 500 });
    }
    
    // For all other errors, we serve a fallback quiz
    return createErrorResponse(
        err instanceof ZodError ? JSON.stringify(err.format()) : err.message,
        reqId,
        500,
        "AI_FLOW_FAILED"
    );
  }
}
