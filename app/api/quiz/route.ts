
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackQuizData } from '@/lib/fallback-quiz';

const GENERATION_TIMEOUT = 8000; // 8 seconds
const VALID_FORMATS = ['ipl', 'test', 'odi', 't20', 'mixed', 'wpl'];

export async function POST(req: NextRequest) {
  let format = 'mixed';
  let fallbackReason: string | null = null;
  let originalFormat = 'mixed';

  try {
    const body = await req.json();
    const reqFormat = body.format || 'mixed';
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }
    
    // Normalize format to lowercase for reliable key access
    format = reqFormat.toLowerCase();
    originalFormat = format;

    // Validate format against the allowed list
    if (!VALID_FORMATS.includes(format)) {
      fallbackReason = `Invalid format '${reqFormat}' provided.`;
      console.warn(`[Fallback] ${fallbackReason}. Defaulting to 'mixed'.`);
      format = 'mixed';
    }

    const quizData = await Promise.race([
        generateQuiz({ format, userId }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), GENERATION_TIMEOUT))
    ]);
    
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
        fallbackReason = fallbackReason || 'AI returned incomplete or invalid quiz data.';
        console.warn(`[Fallback] ${fallbackReason} for format '${originalFormat}'. Using fallback.`);
        const fallback = fallbackQuizData[originalFormat] || fallbackQuizData['mixed'];
        return NextResponse.json({ ...fallback, source: 'fallback', fallbackReason });
    }
    
    return NextResponse.json({ ...quizData, source: 'ai' });

  } catch (error: any) {
    const errorMessage = error.message === "Timeout"
      ? `AI generation timed out`
      : `An error occurred during generation: ${error.message}`;

    fallbackReason = errorMessage;

    console.warn(`[Fallback] ${fallbackReason} for format '${originalFormat}'. Using fallback.`);

    const fallback = fallbackQuizData[originalFormat] || fallbackQuizData['mixed'];
    return NextResponse.json({ ...fallback, source: 'fallback', fallbackReason });
  }
}
