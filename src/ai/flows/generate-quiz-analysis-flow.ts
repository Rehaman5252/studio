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

// This internal schema is used to format the data for the prompt,
// avoiding the need for complex Handlebars helpers.
const PromptInputSchema = z.object({
    quizData: z.array(z.object({
        questionNumber: z.number(),
        questionText: z.string(),
        correctAnswer: z.string(),
        userAnswer: z.string(),
    })),
});

const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateQuizAnalysisOutputSchema },
  prompt: `You are an expert cricket coach and quiz analyst. Your goal is to provide encouraging and insightful feedback to a user based on their quiz performance.

Analyze the provided quiz data, which includes the questions, the correct answers, and the user's answers.

Based on the data, generate a personalized performance report. The report should:
1.  **Start with an encouraging summary** of their performance.
2.  **Identify Strengths**: Point out topics or question types where the user did well. For example, "You have a strong grasp of recent IPL events."
3.  **Identify Areas for Improvement**: Gently point out where the user went wrong without being discouraging. For example, "It seems like questions about cricket history before 2010 were a bit tricky."
4.  **Provide Actionable Tips**: Give 2-3 specific, actionable tips for how they can improve. For example, "To brush up on Test cricket records, you could watch highlights from classic matches on YouTube" or "Following a good cricket news website can help with staying up-to-date on player stats."
5.  **Maintain a positive, coach-like tone** throughout the analysis.
6.  **Format the output as Markdown**, using headings, bold text, and lists to make it readable.

Here is the quiz data:
{{#each quizData}}
---
Question {{this.questionNumber}}: {{this.questionText}}
Correct Answer: {{this.correctAnswer}}
User's Answer: {{this.userAnswer}}
{{/each}}
`,
});

const generateQuizAnalysisFlow = ai.defineFlow(
  {
    name: 'generateQuizAnalysisFlow',
    inputSchema: GenerateQuizAnalysisInputSchema,
    outputSchema: GenerateQuizAnalysisOutputSchema,
  },
  async (input) => {
    // Transform the input to match the prompt's simpler schema
    const promptInput = {
        quizData: input.questions.map((q, index) => ({
            questionNumber: index + 1,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
            userAnswer: input.userAnswers[index] || 'Not Answered',
        })),
    };

    const { output } = await analysisPrompt(promptInput);
    return output!;
  }
);
