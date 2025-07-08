
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

// A more robust schema for the prompt's structured input.
const AnalysisPromptInputSchema = z.object({
  score: z.number().describe("The user's score."),
  totalQuestions: z.number().describe('The total number of questions in the quiz.'),
  totalTime: z.number().describe('The total time taken in seconds.'),
  hintsUsed: z.number().describe('The number of hints the user used.'),
  format: z.string().describe('The cricket format of the quiz.'),
  incorrectAnswersSummary: z.string().describe("A summary of incorrectly answered questions, with each on a new line."),
  hasIncorrectAnswers: z.boolean().describe("Whether the user had any incorrect answers."),
});
type AnalysisPromptInput = z.infer<typeof AnalysisPromptInputSchema>;


const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: { schema: AnalysisPromptInputSchema },
  output: { schema: GenerateQuizAnalysisOutputSchema },
  prompt: `You are 'Coach Cric', an encouraging and friendly AI cricket coach.
Your goal is to provide a helpful analysis of the user's quiz performance in markdown format. The analysis should be insightful and include tips for improvement based on their results.

Your report must cover these points:
1.  **Overall Performance**: Start with a one-sentence summary of their score.
2.  **Speed & Accuracy**: Analyze their total time taken. Mention if they were fast and accurate, or if they should take more time to read the questions.
3.  **Hint Utilization**: Comment on the number of hints used. If hints were used, gently encourage them to build confidence. If no hints were used, praise them.
4.  **Areas for Improvement**: Based on their wrong answers for the given format, suggest a specific cricket topic or player to focus on. If all answers were correct, praise their perfect knowledge.
5.  **Coach's Tip**: Give a single, actionable tip for their next quiz.

Keep the entire analysis concise, positive, and easy to read.

Here is the user's performance data:
- Format: {{format}}
- Score: {{score}} out of {{totalQuestions}}
- Time Taken: {{totalTime}} seconds
- Hints Used: {{hintsUsed}}
- Summary of Incorrect Answers:
{{#if hasIncorrectAnswers}}
{{{incorrectAnswersSummary}}}
{{else}}
The user answered all questions correctly!
{{/if}}
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
    
    // This format detection is basic, can be improved if more formats are sponsored.
    const format = input.questions[0]?.questionText.includes('IPL') ? 'IPL' : (input.questions[0]?.questionText.includes('Test') ? 'Test' : 'General Cricket');

    const incorrect = input.questions
      .map((q, index) => ({
        ...q,
        userAnswer: input.userAnswers[index] || 'Not Answered',
        isCorrect: input.userAnswers[index] === q.correctAnswer,
        questionNumber: index + 1,
      }))
      .filter(q => !q.isCorrect);

    const hasIncorrectAnswers = incorrect.length > 0;
    
    const incorrectAnswersSummary = hasIncorrectAnswers
      ? incorrect.map(q => 
          `- Q${q.questionNumber}: "${q.questionText}" (Correct: ${q.correctAnswer})`
        ).join('\n')
      : "N/A";
    
    const totalTime = input.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;
    
    const promptInput: AnalysisPromptInput = {
        score,
        totalQuestions: input.questions.length,
        totalTime: parseFloat(totalTime.toFixed(1)),
        hintsUsed: input.usedHintIndices?.length || 0,
        format,
        incorrectAnswersSummary,
        hasIncorrectAnswers,
    };
    
    try {
        const { output } = await analysisPrompt(promptInput);
    
        if (!output || !output.analysis || output.analysis.trim() === '') {
            // AI returned an empty or invalid response.
            throw new Error("AI returned a null or empty analysis object.");
        }
        
        return output;

    } catch (error) {
        console.error("AI analysis call failed. Providing fallback response.", { error });
    }

    // Fallback logic for any failure in the try block
    const fallbackAnalysis = `### Analysis Currently Unavailable

We couldn't generate a detailed AI analysis for this quiz at the moment.

**Your Score:** ${score}/${input.questions.length}

You can try generating the analysis again from your Quiz History later.
`;
    return { analysis: fallbackAnalysis };
  }
);
