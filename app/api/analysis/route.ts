import { NextResponse } from "next/server";
import { generateQuizAnalysis } from "@/ai/flows/generate-quiz-analysis";
import { QuizAnalysisOutputSchema } from "@/ai/schemas";
import type { QuizAnalysisOutput, QuizAttempt } from "@/ai/schemas";
import { sanitizeQuizAttempt } from "@/lib/sanitizeUserProfile";
import { v4 as uuidv4 } from "uuid";

const getFallbackAnalysisForApi = (attempt: any): QuizAnalysisOutput => {
    const format = attempt?.format || "cricket";
    const score = attempt?.score ?? "a good";
    const total = attempt?.totalQuestions ?? "your";

    return {
        summary: `A solid effort on the ${format} quiz! You scored ${score} out of ${total}. We're showing general feedback as the AI coach is unavailable.`,
        strengths: ["Consistency in completing quizzes.", "Willingness to learn and improve."],
        weaknesses: ["Potential gaps in specific eras or player stats.", "Time management on difficult questions."],
        recommendations: ["Review questions you were unsure about.", "Focus on one cricket format to build deep knowledge.", "Try to answer questions you're confident about more quickly."],
        source: "fallback",
    };
};

export async function POST(req: Request) {
  const requestId = uuidv4();
  let attemptBody: any;
  
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.attempt) {
      return NextResponse.json({ ok: false, analysis: getFallbackAnalysisForApi({}), requestId }, { status: 400 });
    }
    
    attemptBody = body.attempt;

    // --- Step 1: Try AI Flow ---
    try {
        const sanitizedAttempt = sanitizeQuizAttempt(attemptBody) as QuizAttempt;
        const analysis = await generateQuizAnalysis(sanitizedAttempt);
        
        // Final validation before sending to client
        const parsed = QuizAnalysisOutputSchema.safeParse(analysis);

        if (!parsed.success) {
          console.error(`[Analysis AI error] reqId=${requestId} - AI output failed validation`, parsed.error);
          // Fall through to static fallback
        } else {
           return NextResponse.json({ ok: true, analysis: parsed.data, requestId });
        }
    } catch (aiError) {
      console.error(`[Analysis AI error] reqId=${requestId}`, aiError);
      // Fall through to static fallback
    }

    // --- Step 2: Static Fallback ---
    const fallbackAnalysis = getFallbackAnalysisForApi(attemptBody);
    return NextResponse.json({ ok: true, analysis: fallbackAnalysis, fallback: true, requestId });

  } catch (err: any) {
     console.error(`[Analysis route error] reqId=${requestId}`, err);
     return NextResponse.json(
      { ok: false, error: "Invalid request body.", requestId },
      { status: 400 }
    );
  }
}