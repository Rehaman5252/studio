import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackQuizData } from '@/lib/fallback-quiz';

/**
 * @fileOverview API route for generating a quiz.
 *
 * This route handles POST requests to generate a new quiz for a given format and user.
 * It includes robust error handling and a fallback mechanism.
 */

export async function POST(req: NextRequest) {
  try {
    const { format, userId } = await req.json();

    if (!format || !userId) {
      return NextResponse.json({ error: 'Format and userId are required.' }, { status: 400 });
    }

    // Generate the quiz using the Genkit flow
    const quizData = await generateQuiz({ format, userId });
    
    // Validate the output
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
      console.warn(`Generated quiz for format '${format}' was invalid. Using fallback.`);
      const fallback = fallbackQuizData[format] || fallbackQuizData.Mixed;
      return NextResponse.json(fallback);
    }
    
    return NextResponse.json(quizData);

  } catch (error) {
    console.error("Error in /api/quiz route:", error);

    // Fallback mechanism in case of any unexpected error during generation
    try {
        const { format } = await req.json();
        const fallback = fallbackQuizData[format] || fallbackQuizData.Mixed;
        return NextResponse.json(fallback);
    } catch (e) {
        // If even reading the request fails, return a generic fallback
        return NextResponse.json(fallbackQuizData.Mixed);
    }
  }
}
