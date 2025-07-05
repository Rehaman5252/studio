
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

// This internal schema is used to format the data for the prompt.
const PromptInputSchema = z.object({
    quizData: z.array(z.object({
        questionNumber: z.number(),
        questionText: z.string(),
        correctAnswer: z.string(),
        userAnswer: z.string(),
        isCorrect: z.boolean(),
    })),
    totalScore: z.string(),
    format: z.string(),
});

// The prompt will now directly ask for a markdown string.
// We make it nullable to gracefully handle cases where the AI returns nothing, preventing a schema validation crash.
const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: z.string().nullable().describe('A detailed analysis of the user quiz performance, formatted as a single markdown string.') },
  prompt: `You are an expert cricket coach. Generate a personalized performance report as a single, raw markdown-formatted string.

The analysis MUST be encouraging and cover these sections:
1.  **Overall Performance**: Start with a summary of their score (e.g., "Great job on the {format} quiz! A score of {totalScore} is a solid performance.").
2.  **Areas for Improvement**: Based on the incorrect answers, identify 1-2 specific topics for the user to study (e.g., "It looks like questions about 1990s Test cricket were tricky. Brushing up on that era could boost your score.").
3.  **Actionable Tip**: Provide one specific, actionable tip for improvement (e.g., "To master player statistics, try exploring ESPNcricinfo's Statsguru section.").

Maintain a positive, coach-like tone.

Here is the quiz data:
Format: {{format}}
Score: {{totalScore}}

Incorrect Answers:
{{#each quizData}}
  {{#unless this.isCorrect}}
    - **Q{{this.questionNumber}}**: {{this.questionText}}
      - **Your Answer**: {{this.userAnswer}}
      - **Correct Answer**: {{this.correctAnswer}}
  {{/unless}}
{{/each}}
`,
  config: {
    // Relax safety settings completely to prevent the model from returning null.
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
});

const generateQuizAnalysisFlow = ai.defineFlow(
  {
    name: 'generateQuizAnalysisFlow',
    inputSchema: GenerateQuizAnalysisInputSchema,
    // The flow's external contract still returns the structured object.
    outputSchema: GenerateQuizAnalysisOutputSchema,
  },
  async (input) => {
    // Transform the input to match the prompt's simpler schema
    const score = input.questions.reduce((acc, q, index) => 
        (input.userAnswers[index] === q.correctAnswer) ? acc + 1 : acc, 0);

    const promptInput = {
        quizData: input.questions.map((q, index) => ({
            questionNumber: index + 1,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
            userAnswer: input.userAnswers[index] || 'Not Answered',
            isCorrect: input.userAnswers[index] === q.correctAnswer,
        })),
        totalScore: `${score}/${input.questions.length}`,
        format: input.questions[0]?.questionText.includes('IPL') ? 'IPL' : 'General Cricket', // Simple format detection
    };

    // The prompt function now returns a promise for a raw string, which could be null.
    const {output} = await analysisPrompt(promptInput);
    
    // Check if the output is null, undefined, or an empty string. This is the critical fix.
    if (!output || output.trim() === '') {
      throw new Error("The AI failed to generate a valid analysis string.");
    }

    // Wrap the raw string into the object format required by the flow's output schema.
    return { analysis: output };
  }
);
