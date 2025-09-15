
import { NextResponse } from "next/server";
import { generateQuizAnalysis } from "@/ai/flows/generate-quiz-analysis";
import { QuizAnalysisOutputSchema } from "@/ai/schemas";
import type { QuizAnalysisOutput } from "@/ai/schemas";

// This is a high-quality, deterministic fallback that is returned if the AI fails.
// It is NOT the primary response.
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
  let attemptBody: any;
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: { message: "Invalid request body." } }, { status: 400 });
    }

    attemptBody = body.attempt;

    if (!attemptBody || typeof attemptBody !== 'object') {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid or missing 'attempt' in request body" } },
        { status: 400 }
      );
    }
    
    // The generateQuizAnalysis flow is hardened and will *always* return a valid analysis or a high-quality fallback.
    const result = await generateQuizAnalysis(attemptBody);
    
    // Final validation before sending to client, just in case.
    const parsed = QuizAnalysisOutputSchema.safeParse(result);

    if (!parsed.success) {
      console.error("[Analysis API] FATAL: Output from hardened flow failed validation. This should not happen.", parsed.error);
      const fallback = getFallbackAnalysisForApi(attemptBody);
      return NextResponse.json({ ok: true, analysis: fallback }, { status: 200 }); 
    }

    return NextResponse.json({ ok: true, analysis: parsed.data }, { status: 200 });

  } catch (err: any) {
    console.error("[Analysis API] A critical unhandled error occurred:", err);
    const fallback = getFallbackAnalysisForApi(attemptBody || {});
    return NextResponse.json(
      { ok: true, analysis: fallback, error: { message: "An internal server error occurred." } }, // Send ok:true with fallback
      { status: 200 } // Send 200 so client can display fallback
    );
  }
}
