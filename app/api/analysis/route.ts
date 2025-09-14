
import { NextResponse } from "next/server";
import { generateQuizAnalysis } from "@/ai/flows/generate-quiz-analysis";
import { QuizAnalysisOutputSchema } from "@/ai/schemas";
import type { QuizAnalysisOutput } from "@/ai/schemas";

const getFallbackAnalysisForApi = (attempt: any): QuizAnalysisOutput => {
    const accuracy = attempt.totalQuestions > 0 ? (attempt.score / attempt.totalQuestions) * 100 : 0;
    
    return {
        summary: `A solid effort on the ${attempt.format} quiz! You scored ${attempt.score} out of ${attempt.totalQuestions}. We're showing general feedback as the AI coach is unavailable.`,
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
    attemptBody = body?.attempt;

    if (!attemptBody) {
      return NextResponse.json(
        { error: "Missing 'attempt' in request body" },
        { status: 400 }
      );
    }
    
    // The generateQuizAnalysis flow is already hardened to return a fallback,
    // so we can be confident it will always return a valid analysis object.
    const result: QuizAnalysisOutput = await generateQuizAnalysis(attemptBody);

    // Even though the flow is hardened, a final validation is good practice.
    const parsed = QuizAnalysisOutputSchema.safeParse(result);
    if (!parsed.success) {
      console.error("[Analysis API] Output validation failed despite hardened flow:", parsed.error);
      return NextResponse.json(getFallbackAnalysisForApi(attemptBody), { status: 200 }); // Return a valid fallback
    }

    return NextResponse.json(parsed.data, { status: 200 });
  } catch (err) {
    console.error("[Analysis API] Unhandled error:", err);
    return NextResponse.json(
      getFallbackAnalysisForApi(attemptBody || {}),
      { status: 500 }
    );
  }
}
