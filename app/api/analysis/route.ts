
import { NextResponse } from 'next/server';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis';
import { sanitizeQuizAttempt } from '@/lib/sanitizeUserProfile';

export const dynamic = 'force-dynamic'; // Ensure this is a dynamic route

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[analysis][${reqId}] incoming request`);

  try {
    const { attempt: rawAttempt } = await req.json();

    if (!rawAttempt || typeof rawAttempt !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid attempt data.' },
        { status: 400 }
      );
    }
    
    // The generateQuizAnalysis function is hardened to handle sanitization,
    // validation, and AI failures internally, always returning a valid analysis object.
    const analysis = await generateQuizAnalysis(rawAttempt);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error(`[analysis][${reqId}] Unhandled error in API route:`, error);
    // This catch block is a secondary safety net.
    return NextResponse.json(
      {
        summary: "Analysis service is temporarily unavailable.",
        strengths: [],
        improvements: [],
        source: "fallback",
      },
      { status: 200 } // Return 200 with fallback data to prevent client error
    );
  }
}
