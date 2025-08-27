
import { NextResponse } from 'next/server';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis';
import { QuizAnalysisOutputSchema } from '@/ai/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { attempt } = await req.json();

    if (!attempt) {
      return NextResponse.json(
        { error: "Missing quiz attempt data." },
        { status: 400 }
      );
    }
    
    const analysis = await generateQuizAnalysis(attempt);

    const parsed = QuizAnalysisOutputSchema.safeParse(analysis);
    if (!parsed.success) {
      console.error("[Analysis API] Validation failed for generated analysis:", parsed.error.format());
      return NextResponse.json({
        summary: "Analysis service is temporarily unavailable.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        source: "fallback",
      });
    }

    return NextResponse.json(parsed.data);

  } catch (error: any) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      {
        summary: "Analysis service is temporarily unavailable.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        source: "fallback",
      },
      { status: 500 } 
    );
  }
}
