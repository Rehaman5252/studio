
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { QuizQuestion } from '@/ai/schemas';

export const dynamic = 'force-dynamic'; // ensure the route is always dynamic

const getFallbackQuiz = (format: string): QuizQuestion[] => {
  // A set of high-quality, generic cricket questions as a fallback
  const fallbackQuestions = [
    {
      question: "Who is known as the 'Little Master' in the world of cricket?",
      options: ["Sachin Tendulkar", "Sunil Gavaskar", "Virat Kohli", "Rahul Dravid"],
      correctAnswer: "Sunil Gavaskar",
      explanation: "Sunil Gavaskar was famously nicknamed the 'Little Master' for his technical proficiency against formidable fast bowlers. Sachin Tendulkar is often referred to as the 'Master Blaster'."
    },
    {
      question: "Which country won the first-ever Cricket World Cup in 1975?",
      options: ["Australia", "England", "India", "West Indies"],
      correctAnswer: "West Indies",
      explanation: "The West Indies, led by Clive Lloyd, defeated Australia in the final at Lord's to become the first-ever Cricket World Cup champions."
    },
    {
      question: "What is the term for a period of six consecutive deliveries bowled by a single bowler?",
      options: ["A Set", "An Over", "A Spell", "A Maiden"],
      correctAnswer: "An Over",
      explanation: "An 'over' consists of six legal deliveries. A 'maiden' is an over where no runs are scored."
    },
    {
      question: "In Test cricket, what does the term 'follow-on' mean?",
      options: [
        "The batting team must bat again immediately after their first innings",
        "The fielding team can choose a different bowler",
        "The umpires can call for a new ball",
        "The batsmen swap ends after each over"
      ],
      correctAnswer: "The batting team must bat again immediately after their first innings",
      explanation: "A captain can enforce the 'follow-on' if their team has a significant first-innings lead (typically 200 runs in a 5-day match), forcing the opposing team to bat again."
    },
    {
      question: "Which bowler has taken the most wickets in the history of Test cricket?",
      options: ["Shane Warne", "Anil Kumble", "James Anderson", "Muttiah Muralitharan"],
      correctAnswer: "Muttiah Muralitharan",
      explanation: "Sri Lanka's Muttiah Muralitharan holds the record for the most wickets in Test cricket, with an incredible 800 wickets to his name."
    }
  ];

  return fallbackQuestions.map(q => ({
    ...q,
    id: uuidv4(),
    format: format,
  }));
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { format, userId, previouslyAskedQuestions = [] } = body;
    
    if (!format || !userId) {
      return NextResponse.json(
        { error: 'Format and userId are required.' },
        { status: 400 }
      );
    }
    
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const quizData = await generateQuiz({ format, userId, count: 5, previouslyAskedQuestions });
        
        if (quizData && quizData.questions && quizData.questions.length > 0) {
          // Success, return the AI-generated quiz
          return NextResponse.json(quizData);
        }
        // If the AI returned an empty or invalid response, this is a failure, so we retry.
        console.warn(`Attempt ${attempt + 1}: AI returned no valid questions. Retrying...`);
        
      } catch (error: any) {
        console.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
      }
      attempt++;
    }

    // If all retries fail, return the fallback quiz
    console.error(`All ${maxRetries} attempts to generate a quiz for format "${format}" failed. Serving fallback quiz.`);
    const fallbackQuizData = { questions: getFallbackQuiz(format) };
    return NextResponse.json(fallbackQuizData);

  } catch (error: any) {
    console.error('API Error generating quiz:', error);
    // This catches errors in the request parsing itself
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz due to an internal server error.' },
      { status: 500 }
    );
  }
}
