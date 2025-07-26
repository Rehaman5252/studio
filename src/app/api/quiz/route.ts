
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // ensure the route is always dynamic

export async function POST(request: Request) {
  try {
    const { format, askedQuestions } = await request.json();
    
    if (!format) {
      return NextResponse.json(
        { error: 'Format is required.' },
        { status: 400 }
      );
    }
    
    const quizData = await generateQuiz({ format, askedQuestions: askedQuestions || [] });
    
    if (!quizData || !quizData.questions || quizData.questions.length < 5) {
      return NextResponse.json(
        { error: 'Failed to generate a valid quiz.' },
        { status: 500 }
      );
    }

    return NextResponse.json(quizData);
  } catch (error) {
    console.error('API Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz due to an internal server error.' },
      { status: 500 }
    );
  }
}
    