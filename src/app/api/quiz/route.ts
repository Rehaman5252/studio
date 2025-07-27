
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
    
    // If AI fails (returns empty array), use the guaranteed fallback
    if (!quizResponse || !quizResponse.questions || quizResponse.questions.length < 5) {
        console.warn(`AI generation failed or returned insufficient questions for format: ${input.format}. Serving fallback quiz.`);
        const fallbackQuestions = getFallbackQuestions(input.format);
        return NextResponse.json({ questions: fallbackQuestions });
    }
    
    // If AI succeeds, return its questions
    return NextResponse.json(quizResponse);

  } catch (error: any) {
    console.error('🔥 Unhandled error in /api/quiz route:', error);
    // Final safety net: if anything else breaks, serve fallback questions.
    // This ensures the API NEVER crashes.
    const { format } = await req.json().catch(() => ({ format: 'Mixed' })); // Safely get format
    const fallbackQuestions = getFallbackQuestions(format);
    return NextResponse.json(
      { questions: fallbackQuestions, error: 'An unexpected server error occurred.' },
      { status: 200 } // Return 200 so the frontend can still render the quiz
    );
  }
}
