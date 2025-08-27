
import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis';
import { sanitizeQuizAttempt } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/ai/schemas';

export const dynamic = 'force-dynamic'; // Ensure this is a dynamic route

export async function POST(req: Request) {
  const reqId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[analysis][${reqId}] incoming request`);

  try {
    const { attempt: rawAttempt } = await req.json();

    if (!rawAttempt || !rawAttempt.userId || !rawAttempt.slotId) {
      return NextResponse.json({ error: 'Missing required attempt data.' }, { status: 400 });
    }

    // The client sends the raw attempt object directly
    const analysis = await generateQuizAnalysis(rawAttempt);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error(`[analysis][${reqId}] Unhandled error in API route:`, error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
