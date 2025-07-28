
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
        const quizResponse = await generateQuiz(input);
        if (quizResponse && quizResponse.questions.length === 5) {
            console.log('Successfully served AI-generated quiz.');
            return NextResponse.json(quizResponse);
        } else {
            // This case might be hit if the AI returns a malformed but not error-throwing response.
            // It's a good safety net.
            console.warn(`AI generation returned invalid data for format: ${input.format}. Serving fallback quiz.`);
            const fallbackQuestions = getFallbackQuestions(input.format);
            return NextResponse.json({ questions: fallbackQuestions });
        }
    } catch (aiError) {
        // This will catch errors thrown from the AI flow itself (e.g., network issues, parsing failures).
        console.error('AI generation failed, serving fallback quiz.', aiError);
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
