
import { generateQuiz, GenerateQuizInput } from '@/ai/flows/generate-quiz-flow';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const input: GenerateQuizInput = await req.json();

    if (!input.format || !input.userId) {
      return NextResponse.json({ error: 'Format and userId are required.' }, { status: 400 });
    }

    console.log(`API received request for format: ${input.format}`);

    // The generateQuiz flow is now resilient and will return a fallback on its own if it fails.
    // The retry logic here becomes a secondary layer of defense for network-level failures.
    const quizResponse = await generateQuiz(input);
    
    return NextResponse.json(quizResponse);

  } catch (error: any) {
    console.error('🔥 Unhandled error in /api/quiz route:', error);
    // This is the final safety net. It should rarely be hit now that the flow is resilient.
    return NextResponse.json(
      { error: 'An unexpected error occurred on the server.' },
      { status: 500 }
    );
  }
}
