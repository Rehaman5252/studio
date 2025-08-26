
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackQuizData } from '@/lib/fallback-quiz';
import { mapFirestoreError } from '@/lib/utils';
import { isFirebaseConfigured } from '@/lib/firebase';

const GENERATION_TIMEOUT = 15000; // 15 seconds
const VALID_FORMATS = ['ipl', 'test', 'odi', 't20', 'mixed', 'wpl'];

export async function POST(req: NextRequest) {
  let requestedFormat = 'mixed';
  let fallbackReason: string | null = null;
  
  try {
    // Critical Pre-check: Ensure Firebase is configured on the server.
    if (!isFirebaseConfigured) {
        console.error("[API /quiz] Critical Error: Firebase server environment variables are not configured.");
        return NextResponse.json({ error: 'Server is not configured correctly. Please contact support.' }, { status: 503 }); // 503 Service Unavailable
    }

    const body = await req.json();
    const { userId, format } = body;

    if (!userId) {
      console.error("[API /quiz] Critical Error: userId is required in the request body.");
      return NextResponse.json({ error: 'User identification is missing. Please sign in again.' }, { status: 400 });
    }
    
    const formatFromRequest = (format || 'mixed').toLowerCase();
    
    if (!VALID_FORMATS.includes(formatFromRequest)) {
      fallbackReason = `Invalid format '${format}' provided. Defaulting to 'mixed'.`;
      console.warn(`[API /quiz] Fallback Triggered for userId: ${userId}. Reason: ${fallbackReason}`);
      requestedFormat = 'mixed';
    } else {
      requestedFormat = formatFromRequest;
    }

    console.log(`[API /quiz] Generating quiz for format: ${requestedFormat}, userId: ${userId}`);
    const quizPromise = generateQuiz({ format: requestedFormat, userId });
    
    const quizData = await Promise.race([
        quizPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), GENERATION_TIMEOUT))
    ]);
    
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
        fallbackReason = fallbackReason || 'AI returned incomplete or invalid quiz data.';
        console.warn(`[API /quiz] Fallback Triggered for userId: ${userId}. Reason: ${fallbackReason} for format '${requestedFormat}'. Using fallback quiz.`);
        const fallback = fallbackQuizData[requestedFormat] || fallbackQuizData['mixed'];
        return NextResponse.json({ ...fallback, source: 'fallback', fallbackReason });
    }
    
    console.log(`[API /quiz] Successfully generated AI quiz for userId: ${userId}, format: ${requestedFormat}`);
    return NextResponse.json({ ...quizData, source: 'ai' });

  } catch (error: any) {
    const isTimeout = error.message === "Timeout";
    const errorMessage = isTimeout
      ? `AI generation timed out after ${GENERATION_TIMEOUT}ms for format '${requestedFormat}'`
      : mapFirestoreError(error);

    console.error(`[Quiz API Error] for format ${requestedFormat}:`, error);

    const fallback = fallbackQuizData[requestedFormat] || fallbackQuizData['mixed'];
    
    // We only send a 500 error if it's a genuine server-side issue, not just a timeout.
    // For timeouts, we still return a fallback quiz but with a 200 OK status to avoid scary errors on client.
    const status = isTimeout ? 200 : 500;

    return NextResponse.json({ 
        ...fallback, 
        source: 'fallback', 
        fallbackReason: errorMessage 
    }, { status });
  }
}
