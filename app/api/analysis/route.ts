
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

    // The generateQuizAnalysis flow is now hardened and should always return a valid object.
    // We can still validate as a final safety check.
    const parsed = QuizAnalysisOutputSchema.safeParse(result);
    if (!parsed.success) {
      console.error("[Analysis API] Output validation failed despite hardened flow:", parsed.error);
      // This path should ideally not be hit, but if it is, send a generic fallback.
      return NextResponse.json(
        {
          overallPerformance: "An unexpected error occurred while generating analysis.",
          accuracy: 0,
          averageTimePerQuestion: 0,
          keyStrengths: [],
          areasForImprovement: [],
          coachTip: "Practice makes perfect. Keep playing!",
          analyzedQuestions: [],
          source: "fallback",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(parsed.data, { status: 200 });
  } catch (err) {
    console.error("[Analysis API] Unhandled error:", err);
    // The client should never receive a 500 error that breaks the app.
    // Always return a valid JSON structure with a fallback source.
    return NextResponse.json(
      {
        overallPerformance: "An unexpected server error occurred. Please try again later.",
        accuracy: 0,
        averageTimePerQuestion: 0,
        keyStrengths: [],
        areasForImprovement: [],
        coachTip: "Keep playing!",
        analyzedQuestions: [],
        source: "fallback",
      },
      { status: 500 } // Use 500 to indicate a server issue, but client can still parse the body.
    );
  }
}
