
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // ensure the route is always dynamic

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { format, userId } = body;
    
    if (!format || !userId) {
      return NextResponse.json(
        { error: 'Format and userId are required.' },
        { status: 400 }
      );
    }
    
    const quizData = await generateQuiz({ format, userId });
    
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
      return NextResponse.json(
        { error: 'Failed to generate a valid quiz.' },
        { status: 500 }
      );
    }

    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error('API Error generating quiz:', error);
    // Always return a JSON response, even on error.
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz due to an internal server error.' },
      { status: 500 }
    );
  }
}
