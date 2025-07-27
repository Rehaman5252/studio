
'use server';

/**
 * @fileOverview A flow that generates a 5-question cricket quiz.
 * This flow is designed to be resilient, returning a fallback quiz
 * if the AI fails to generate a valid one, thus preventing server crashes.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { QuizQuestion } from '@/lib/mockData';

const GenerateQuizInputSchema = z.object({
  format: z.string().describe("The cricket format for the quiz (e.g., T20, IPL, Test)."),
  userId: z.string().describe("The unique ID of the user requesting the quiz."),
  askedQuestionIds: z.array(z.string()).optional().describe("An array of question IDs that the user has already seen to ensure variety."),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      format: z.string(),
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctAnswer: z.string(),
      explanation: z.string().optional(),
    })
  ).length(5),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

// AIGeneratedQuestionSchema defines the structure we expect from the AI *before* validation and ID assignment.
const AIGeneratedQuestionSchema = z.object({
  question: z.string().describe("The full text of the quiz question."),
  options: z.array(z.string()).length(4).describe("An array of exactly four possible answer options."),
  correctAnswer: z.string().describe("The correct answer. CRITICALLY: This MUST be an exact, case-sensitive match to one of the strings in the 'options' array."),
  explanation: z.string().optional().describe("A brief, interesting explanation for the correct answer."),
});

// AIGeneratedResponseSchema defines the overall structure of the AI's JSON output.
const AIGeneratedResponseSchema = z.object({
    questions: z.array(AIGeneratedQuestionSchema).min(5).max(5),
});

function getFallbackQuestions(format: string): QuizQuestion[] {
    const questions: Record<string, QuizQuestion[]> = {
        'IPL': [
            { id: 'fb_ipl_1', format: 'IPL', question: 'Which team has won the most IPL titles?', options: ['Mumbai Indians', 'Chennai Super Kings', 'Kolkata Knight Riders', 'Royal Challengers Bengaluru'], correctAnswer: 'Mumbai Indians', explanation: 'Mumbai Indians and Chennai Super Kings are the most successful teams in IPL history.' },
            { id: 'fb_ipl_2', format: 'IPL', question: 'Who is known as "Mr. IPL"?', options: ['Suresh Raina', 'Virat Kohli', 'MS Dhoni', 'Rohit Sharma'], correctAnswer: 'Suresh Raina', explanation: 'Suresh Raina earned the nickname for his consistent run-scoring in the early seasons of the IPL.' },
            { id: 'fb_ipl_3', format: 'IPL', question: 'Which player holds the record for the highest individual score in an IPL match?', options: ['Chris Gayle', 'Brendon McCullum', 'AB de Villiers', 'KL Rahul'], correctAnswer: 'Chris Gayle', explanation: 'Chris Gayle scored an unbeaten 175 for Royal Challengers Bangalore against Pune Warriors India in 2013.' },
            { id: 'fb_ipl_4', format: 'IPL', question: 'In which year was the first IPL season held?', options: ['2008', '2007', '2009', '2010'], correctAnswer: '2008', explanation: 'The inaugural season of the Indian Premier League took place in 2008.' },
            { id: 'fb_ipl_5', format: 'IPL', question: 'Who was the first player to score a century in the IPL?', options: ['Brendon McCullum', 'Sachin Tendulkar', 'Adam Gilchrist', 'Manish Pandey'], correctAnswer: 'Brendon McCullum', explanation: 'Brendon McCullum scored 158* in the very first IPL match for Kolkata Knight Riders.' },
        ],
        'Test': [
            { id: 'fb_test_1', format: 'Test', question: 'Who has the most wickets in Test cricket history?', options: ['Muttiah Muralitharan', 'Shane Warne', 'Anil Kumble', 'James Anderson'], correctAnswer: 'Muttiah Muralitharan', explanation: 'Sri Lankan spinner Muttiah Muralitharan holds the record with 800 Test wickets.' },
            { id: 'fb_test_2', format: 'Test', question: 'What is the highest individual score by a batsman in Test cricket?', options: ['Brian Lara', 'Matthew Hayden', 'Don Bradman', 'Virender Sehwag'], correctAnswer: 'Brian Lara', explanation: 'Brian Lara scored 400 not out for West Indies against England in 2004.' },
            { id: 'fb_test_3', format: 'Test', question: 'A standard Test match is scheduled to last for how many days?', options: ['5', '4', '6', '3'], correctAnswer: '5', explanation: 'Standard Test matches are played over five days, with each day typically consisting of three sessions.' },
            { id: 'fb_test_4', format: 'Test', question: 'Which country is famous for the "Bodyline" bowling tactic?', options: ['England', 'Australia', 'West Indies', 'South Africa'], correctAnswer: 'England', explanation: 'The "Bodyline" series took place in 1932-33 when England toured Australia.' },
            { id: 'fb_test_5', format: 'Test', question: 'Who is the only batsman to have an average of 99.94 in Test cricket?', options: ['Don Bradman', 'Sachin Tendulkar', 'Steve Smith', 'Jacques Kallis'], correctAnswer: 'Don Bradman', explanation: 'Sir Donald Bradman of Australia is widely regarded as the greatest batsman of all time.' },
        ],
        'T20': [
            { id: 'fb_t20_1', format: 'T20', question: 'Which country won the first-ever ICC World T20 in 2007?', options: ['India', 'Pakistan', 'Australia', 'England'], correctAnswer: 'India', explanation: 'India beat Pakistan in a thrilling final to win the inaugural ICC World T20 in South Africa.' },
            { id: 'fb_t20_2', format: 'T20', question: 'Who holds the record for the fastest century in T20 international cricket?', options: ['David Miller', 'Rohit Sharma', 'Chris Gayle', 'Suryakumar Yadav'], correctAnswer: 'David Miller', explanation: 'David Miller of South Africa scored a 35-ball century against Bangladesh in 2017. Rohit Sharma later equaled this record.' },
            { id: 'fb_t20_3', format: 'T20', question: 'A bowler is allowed to bowl a maximum of how many overs in a T20 match?', options: ['4', '5', '3', '10'], correctAnswer: '4', explanation: 'In a standard 20-over T20 match, each bowler is restricted to a maximum of 4 overs.' },
            { id: 'fb_t20_4', format: 'T20', question: 'What is the term for the first six overs of a T20 innings with fielding restrictions?', options: ['Powerplay', 'Free Hit', 'Super Over', 'Opening Stand'], correctAnswer: 'Powerplay', explanation: 'The Powerplay in T20s restricts the fielding team to having only two fielders outside the 30-yard circle.' },
            { id: 'fb_t20_5', format: 'T20', question: 'Which player has hit the most sixes in T20 international history?', options: ['Rohit Sharma', 'Chris Gayle', 'Martin Guptill', 'Virat Kohli'], correctAnswer: 'Rohit Sharma', explanation: 'Rohit Sharma from India holds the record for hitting the most sixes in T20 International matches.' },
        ],
    };
    return questions[format] || questions['Test'];
}


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  prompt: `You are an expert cricket quiz creator. Your task is to generate a JSON object containing exactly 5 unique, challenging, and interesting questions for a quiz about "{{format}}" cricket.

Ensure the questions cover a range of topics including player records, famous matches, and historical events related to the "{{format}}" format.

The user has already answered questions with the following IDs, so please generate completely new questions:
{{#if askedQuestionIds}}
{{#each askedQuestionIds}}
- {{this}}
{{/each}}
{{else}}
(No questions seen yet)
{{/if}}

Your response MUST be a single, valid JSON object that conforms to this structure:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}

CRITICALLY: The value for 'correctAnswer' MUST be an exact, case-sensitive match to one of the strings in the 'options' array. Do not add any extra text or conversational pleasantries. Only output the JSON object.
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    console.log('generateQuizFlow started with input:', input);

    try {
        const llmResponse = await prompt(input);
        const output = llmResponse.output();

        // **Robust Parsing Logic**
        // Expect the AI to return an object with a 'questions' property.
        // This is the most reliable pattern.
        if (!output || !('questions' in output) || !Array.isArray(output.questions)) {
            console.warn('AI did not return the expected { questions: [...] } structure. Using fallback.');
            return { questions: getFallbackQuestions(input.format) };
        }

        const rawQuestions = output.questions;

        // Validate and transform the questions
        const validatedQuestions: QuizQuestion[] = rawQuestions
            .map(q => {
                // Zod validation for each question
                const parsed = AIGeneratedQuestionSchema.safeParse(q);
                if (!parsed.success) {
                    console.warn('AI generated an invalid question, filtering out:', parsed.error);
                    return null;
                }
                // Check if correctAnswer is one of the options
                if (!parsed.data.options.includes(parsed.data.correctAnswer)) {
                    console.warn('AI generated a question where correctAnswer is not in options, filtering out:', parsed.data);
                    return null;
                }
                return {
                    ...parsed.data,
                    id: uuidv4(), // Assign a unique ID
                    format: input.format, // Assign the correct format
                };
            })
            .filter((q): q is QuizQuestion => q !== null);

        if (validatedQuestions.length < 5) {
            console.warn(`AI generated only ${validatedQuestions.length} valid questions. Using fallback.`);
            return { questions: getFallbackQuestions(input.format) };
        }

        console.log('Successfully generated and validated questions.');
        return { questions: validatedQuestions };

    } catch (err) {
      console.error('Catastrophic error in generateQuizFlow, returning fallback.', err);
      // This catch is a final safety net. If anything unexpected happens, we return a fallback.
      return { questions: getFallbackQuestions(input.format) };
    }
  }
);
