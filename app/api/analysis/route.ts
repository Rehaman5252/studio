
import { NextResponse } from "next/server";
import { generateQuizAnalysis } from "@/ai/flows/generate-quiz-analysis";
import { QuizAnalysisOutputSchema } from "@/ai/schemas";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.attempt) {
      return NextResponse.json(
        { error: "Missing 'attempt' in request body" },
        { status: 400 }
      );
    }

    const result = await generateQuizAnalysis(body.attempt);

    // Double-check the shape before returning
    const parsed = QuizAnalysisOutputSchema.safeParse(result);
    if (!parsed.success) {
      console.error("[Analysis API] Output validation failed:", parsed.error);
      return NextResponse.json(
        {
          summary:
            "We couldn’t generate AI analysis this time, but here are general insights.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          source: "fallback",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(parsed.data, { status: 200 });
  } catch (err) {
    console.error("[Analysis API] Unhandled error:", err);
    return NextResponse.json(
      {
        summary:
          "We couldn’t generate AI analysis due to a server error. Showing fallback.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        source: "fallback",
      },
      { status: 200 } // still 200 so client reliably parses JSON
    );
  }
}
