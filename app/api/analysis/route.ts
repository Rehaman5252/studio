
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

    // Double-check the shape before returning
    const parsed = QuizAnalysisOutputSchema.safeParse(result);
    if (!parsed.success) {
      console.error("[Analysis API] Output validation failed:", parsed.error);
      // The generateQuizAnalysis flow has its own robust fallback.
      // If validation *still* fails, it's a critical error, but we still
      // send a structured fallback to the client to prevent crashes.
      return NextResponse.json(
        {
          overallPerformance: "We couldn’t generate AI analysis this time, but here are general insights.",
          accuracy: body.attempt?.accuracy || 0,
          averageTimePerQuestion: body.attempt?.averageTimePerQuestion || 0,
          keyStrengths: ["Completed the quiz!"],
          areasForImprovement: ["Focus on reviewing incorrect answers."],
          coachTip: "Practice makes perfect. Keep playing to improve your skills!",
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
      { status: 200 } // still 200 so client reliably parses JSON
    );
  }
}
