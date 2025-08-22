
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackQuizData } from '@/lib/fallback-quiz';

/**
 * @fileOverview API route for generating a quiz.
 *
 * This route handles POST requests to generate a new quiz for a given format and user.
 * It includes robust error handling, a timeout mechanism, and a fallback system.
 */

const GENERATION_TIMEOUT = 8000; // 8 seconds

export async function POST(req: NextRequest) {
  let format = 'mixed'; // Default format, lowercase
  try {
    const body = await req.json();
    // Normalize format to lowercase to handle potential casing inconsistencies from the client
    format = (body.format || 'mixed').toLowerCase();
    const { userId } = body;

    if (!format || !userId) {
      return NextResponse.json({ error: 'Format and userId are required.' }, { status: 400 });
    }

    // Race the AI generation against a timeout
    const quizData = await Promise.race([
        generateQuiz({ format, userId }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), GENERATION_TIMEOUT))
    ]);
    
    // Validate the output
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
      if (!quizData) {
        console.warn(`[Fallback] AI generation timed out for format '${format}'. Using fallback.`);
      } else {
        console.warn(`[Fallback] Generated quiz for format '${format}' was invalid or incomplete. Using fallback.`);
      }
      const fallback = fallbackQuizData[format] || fallbackQuizData.mixed;
      return NextResponse.json(fallback);
    }
    
    return NextResponse.json(quizData);

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
        console.error("Error in /api/quiz route, using fallback:", error);
    }
    console.warn(`[Fallback] An error occurred during generation for format '${format}'. Using fallback.`);

    // Fallback mechanism in case of any unexpected error during generation
    // Use the format variable that was captured and normalized at the beginning.
    const fallback = fallbackQuizData[format] || fallbackQuizData.mixed;
    return NextResponse.json(fallback);
  }
}
