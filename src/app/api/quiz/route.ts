
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
    
    // Attempt to generate quiz from AI
    const quizResponse = await generateQuiz(input);
    
    // Check if the AI generation was successful. The flow returns an empty array on failure.
    if (quizResponse && quizResponse.questions.length === 5) {
        console.log('Successfully served AI-generated quiz.');
        return NextResponse.json(quizResponse);
    } else {
        // If AI generation failed, serve the guaranteed fallback quiz.
        console.warn(`AI generation failed or returned invalid data for format: ${input.format}. Serving fallback quiz.`);
        const fallbackQuestions = getFallbackQuestions(input.format);
        return NextResponse.json({ questions: fallbackQuestions });
    }

  } catch (error: any) {
    // This is a final safety net for unexpected issues like invalid request JSON.
    console.error('🔥 Unhandled error in /api/quiz route:', error);
    const format = 'Mixed'; // Default format on catastrophic failure
    try {
        const fallbackQuestions = getFallbackQuestions(format);
        return NextResponse.json(
            { questions: fallbackQuestions, error: 'An unexpected server error occurred.' },
            { status: 200 } // Return 200 to ensure frontend can parse it.
        );
    } catch(e) {
         return NextResponse.json(
            { error: 'An unexpected server error occurred and fallback failed.' },
            { status: 500 }
        );
    }
  }
}
