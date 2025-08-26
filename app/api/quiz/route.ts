
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackQuizData } from '@/lib/fallback-quiz';

const GENERATION_TIMEOUT = 8000; // 8 seconds
const VALID_FORMATS = ['ipl', 'test', 'odi', 't20', 'mixed', 'wpl'];

export async function POST(req: NextRequest) {
  let requestedFormat = 'mixed';
  let fallbackReason: string | null = null;
  
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      console.error("[API /quiz] Error: userId is required.");
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }
    
    // Normalize format to lowercase for reliable key access
    const formatFromRequest = (body.format || 'mixed').toLowerCase();
    
    // Validate format against the allowed list
    if (!VALID_FORMATS.includes(formatFromRequest)) {
      fallbackReason = `Invalid format '${body.format}' provided. Defaulting to 'mixed'.`;
      console.warn(`[API /quiz] Fallback Triggered: ${fallbackReason}`);
      requestedFormat = 'mixed';
    } else {
      requestedFormat = formatFromRequest;
    }

    const quizPromise = generateQuiz({ format: requestedFormat, userId });
    
    const quizData = await Promise.race([
        quizPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), GENERATION_TIMEOUT))
    ]);
    
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
        fallbackReason = fallbackReason || 'AI returned incomplete or invalid quiz data.';
        console.warn(`[API /quiz] Fallback Triggered: ${fallbackReason} for format '${requestedFormat}'. Using fallback.`);
        const fallback = fallbackQuizData[requestedFormat] || fallbackQuizData['mixed'];
        return NextResponse.json({ ...fallback, source: 'fallback', fallbackReason });
    }
    
    return NextResponse.json({ ...quizData, source: 'ai' });

  } catch (error: any) {
    const errorMessage = error.message === "Timeout"
      ? `AI generation timed out for format '${requestedFormat}'`
      : `An error occurred during generation: ${error.message}`;

    fallbackReason = errorMessage;

    console.error(`[API /quiz] Critical Error: ${errorMessage}. Full error:`, error);
    console.warn(`[API /quiz] Fallback Triggered: ${fallbackReason}. Using fallback for '${requestedFormat}'.`);

    const fallback = fallbackQuizData[requestedFormat] || fallbackQuizData['mixed'];
    return NextResponse.json({ ...fallback, source: 'fallback', fallbackReason: "A server error occurred while generating the quiz." });
  }
}
