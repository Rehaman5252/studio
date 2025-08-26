
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackQuizData } from '@/lib/fallback-quiz';
import { mapFirestoreError } from '@/lib/utils';

const GENERATION_TIMEOUT = 15000; // 15 seconds
const VALID_FORMATS = ['ipl', 'test', 'odi', 't20', 'mixed', 'wpl'];

export async function POST(req: NextRequest) {
  let requestedFormat = 'mixed';
  let fallbackReason: string | null = null;
  
  try {
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
    const errorMessage = error.message === "Timeout"
      ? `AI generation timed out after ${GENERATION_TIMEOUT}ms for format '${requestedFormat}'`
      : `An error occurred during quiz generation: ${error.message}`;

    console.error(`[Quiz API Error] for format ${requestedFormat}:`, error);

    const fallback = fallbackQuizData[requestedFormat] || fallbackQuizData['mixed'];
    
    return NextResponse.json({ 
        ...fallback, 
        source: 'fallback', 
        fallbackReason: mapFirestoreError(error) 
    }, { status: 500 });
  }
}
