
import { generateQuiz, GenerateQuizInput } from '@/ai/flows/generate-quiz-flow';
import { getFallbackQuestions } from '@/lib/fallback-quiz';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const input: GenerateQuizInput = await req.json();

    if (!input.format || !input.userId) {
      return NextResponse.json({ error: 'Format and userId are required.' }, { status: 400 });
    }

    console.log(`API received request for format: ${input.format}`);
    
    try {
        // Attempt to generate quiz from AI
        const quizResponse = await generateQuiz(input);
        // This part will only be reached if the AI flow is successful and returns 5 valid questions.
        console.log('Successfully served AI-generated quiz.');
        return NextResponse.json(quizResponse);
    } catch (error) {
        // If generateQuiz throws any error, we catch it here.
        console.warn(`AI generation failed for format: ${input.format}. Serving fallback quiz. Reason:`, (error as Error).message);
        const fallbackQuestions = getFallbackQuestions(input.format);
        return NextResponse.json({ questions: fallbackQuestions });
    }

  } catch (error: any) {
    // This is a final safety net for issues like invalid JSON in the request body.
    console.error('🔥 Unhandled error in /api/quiz route:', error);
    const format = 'Mixed'; // Default format on catastrophic failure
    const fallbackQuestions = getFallbackQuestions(format);
    return NextResponse.json(
      { questions: fallbackQuestions, error: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
