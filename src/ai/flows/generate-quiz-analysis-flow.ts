
'use server';

/**
 * @fileOverview A flow that generates a detailed analysis of a user's quiz performance.
 *
 * - generateQuizAnalysis - A function that provides feedback and improvement tips.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
    GenerateQuizAnalysisInput,
    GenerateQuizAnalysisOutput,
    GenerateQuizAnalysisInputSchema,
    GenerateQuizAnalysisOutputSchema
} from '@/ai/schemas';

export async function generateQuizAnalysis(input: GenerateQuizAnalysisInput): Promise<GenerateQuizAnalysisOutput> {
  return generateQuizAnalysisFlow(input);
}

// A new, simplified schema for the prompt's structured input.
const AnalysisPromptInputSchema = z.object({
  score: z.number().describe("The user's score."),
  totalQuestions: z.number().describe('The total number of questions in the quiz.'),
  totalTime: z.number().describe('The total time taken in seconds.'),
  hintsUsed: z.number().describe('The number of hints the user used.'),
  format: z.string().describe('The cricket format of the quiz.'),
  incorrectAnswersSummary: z.string().describe("A summary of incorrectly answered questions, with each on a new line. This will be empty if all answers were correct."),
});
type AnalysisPromptInput = z.infer<typeof AnalysisPromptInputSchema>;


const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: AnalysisPromptInputSchema },
  output: { schema: GenerateQuizAnalysisOutputSchema },
  prompt: `You are 'Coach Cric', an encouraging AI cricket coach. Analyze the user's quiz performance based on the data below and generate a report for the 'analysis' field.

The report must be in markdown format and include these sections in order:
- **Overall Performance**: A brief, one-sentence summary of their score.
- **Strengths**: Point out one specific area where they did well (e.g., speed on correct answers, knowledge on a specific topic).
- **Improvement Areas**: Briefly mention a topic they could focus on, based on the incorrect answers.
- **Actionable Tip**: Give one single, highly specific, and actionable tip for improving.

Keep the tone very concise, positive, and coach-like.

**User Performance Data:**
- Format: {{format}}
- Score: {{score}}/{{totalQuestions}}
- Total Time Taken: {{totalTime}} seconds
- Hints Used: {{hintsUsed}}
- Incorrect Answers Summary:
{{{incorrectAnswersSummary}}}
`,
  config: {
    // Set extremely permissive safety settings to prevent the model from blocking valid responses.
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateQuizAnalysisFlow = ai.defineFlow(
  {
    name: 'generateQuizAnalysisFlow',
    inputSchema: GenerateQuizAnalysisInputSchema,
    outputSchema: GenerateQuizAnalysisOutputSchema,
  },
  async (input) => {
    const score = input.questions.reduce((acc, q, index) => 
        (input.userAnswers[index] === q.correctAnswer) ? acc + 1 : acc, 0);
    
    const format = input.questions[0]?.questionText.includes('IPL') ? 'IPL' : (input.questions[0]?.questionText.includes('Test') ? 'Test' : 'General Cricket');

    const incorrect = input.questions.map((q, index) => ({
        ...q,
        userAnswer: input.userAnswers[index] || 'Not Answered',
        isCorrect: input.userAnswers[index] === q.correctAnswer,
        questionNumber: index + 1,
    })).filter(q => !q.isCorrect);

    let incorrectAnswersSummary = 'No incorrect answers! Great job!';
    if (incorrect.length > 0) {
        incorrectAnswersSummary = incorrect.map(q => 
            `- Question ${q.questionNumber}: "${q.questionText}" (Correct: ${q.correctAnswer})`
        ).join('\n');
    }
    
    const totalTime = input.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;
    
    const promptInput: AnalysisPromptInput = {
        score,
        totalQuestions: input.questions.length,
        totalTime: parseFloat(totalTime.toFixed(1)),
        hintsUsed: input.usedHintIndices?.length || 0,
        format,
        incorrectAnswersSummary,
    };
    
    console.log("Attempting to generate AI analysis with the following structured data:", promptInput);
    try {
        const { output } = await analysisPrompt(promptInput);
    
        if (!output || !output.analysis || output.analysis.trim() === '') {
          console.warn("AI analysis returned a null or empty analysis object. Providing a fallback response.", { output });
        } else {
            console.log("Successfully generated AI analysis.");
            return output;
        }

    } catch (error) {
        console.error("AI analysis call failed with an error. Providing a fallback response.", { error });
    }

    // Fallback logic
    const fallbackAnalysis = `### Analysis Currently Unavailable

We couldn't generate a detailed AI analysis for this quiz at the moment.

**Your Score:** ${score}/${input.questions.length}

You can try generating the analysis again from your Quiz History later.
`;
    return { analysis: fallbackAnalysis };
  }
);
