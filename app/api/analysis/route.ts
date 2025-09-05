
import { NextResponse } from "next/server";
import { generateQuizAnalysis } from "@/ai/flows/generate-quiz-analysis";
import { QuizAnalysisOutputSchema } from "@/ai/schemas";
import type { QuizAnalysisOutput } from "@/ai/schemas";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.attempt) {
      return NextResponse.json(
        { error: "Missing 'attempt' in request body" },
        { status: 400 }
      );
    }

    const result: QuizAnalysisOutput = await generateQuizAnalysis(body.attempt);

    const parsed = QuizAnalysisOutputSchema.safeParse(result);
    if (!parsed.success) {
      console.error("[Analysis API] Output validation failed despite hardened flow:", parsed.error);
      const fallbackAnalysis: QuizAnalysisOutput = {
          overallPerformance: "An unexpected error occurred while generating analysis.",
          accuracy: 0,
          averageTimePerQuestion: 0,
          keyStrengths: [],
          areasForImprovement: [],
          coachTip: "Practice makes perfect. Keep playing!",
          analyzedQuestions: [],
          source: "fallback",
      };
      return NextResponse.json(fallbackAnalysis, { status: 200 });
    }

    return NextResponse.json(parsed.data, { status: 200 });
  } catch (err) {
    console.error("[Analysis API] Unhandled error:", err);
    const fallbackAnalysis: QuizAnalysisOutput = {
        overallPerformance: "An unexpected server error occurred. Please try again later.",
        accuracy: 0,
        averageTimePerQuestion: 0,
        keyStrengths: [],
        areasForImprovement: [],
        coachTip: "Keep playing!",
        analyzedQuestions: [],
        source: "fallback",
    };
    return NextResponse.json(
      fallbackAnalysis,
      { status: 500 }
    );
  }
}
