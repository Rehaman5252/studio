
import { generateAndStoreQuestionsFlow } from '@/ai/flows/generate-and-store-questions';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// This is a simple trigger for the flow.
// In a production app, you would secure this endpoint or use a scheduled function.
export async function POST(request: Request) {
  try {
    const { count = 10, format = "Mixed" } = await request.json();
    
    const result = await generateAndStoreQuestionsFlow({ count, format });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions due to an internal server error.' },
      { status: 500 }
    );
  }
}
