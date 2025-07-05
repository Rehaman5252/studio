
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
        timeTaken: z.number().optional(),
        hintUsed: z.boolean().optional(),
    })),
    totalTime: z.number().optional(),
    totalHintsUsed: z.number().optional(),
});

const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateQuizAnalysisOutputSchema },
  prompt: `You are an expert cricket coach and quiz analyst. Your goal is to provide a detailed, encouraging, and insightful analysis of a user's quiz performance.
Your output MUST be a JSON object with a single key "analysis". The value for "analysis" must be a markdown-formatted string.

Based on the data provided, generate a personalized performance report. The markdown analysis you generate must cover the following sections:

1.  **Overall Performance Summary**: Start with an encouraging summary of their score and overall performance.
2.  **Knowledge Areas**:
    *   **Strengths**: Identify topics or question types where the user performed well (e.g., "You have a strong grasp of IPL history.").
    *   **Areas for Improvement**: Gently point out topics where the user struggled. Be specific (e.g., "Questions about Test cricket records from the 1990s seemed to be a challenge.").
3.  **Strategic Analysis**:
    *   **Pacing & Time Management**: Analyze their time usage. Did they rush on incorrect answers? Did they take their time on questions they got right? Provide feedback like, "You answered Question 3 very quickly but it was incorrect. It might be helpful to take an extra moment to read all options carefully." or "Your pacing was excellent on the questions you answered correctly."
    *   **Hint Utilization**: Comment on their use of hints. If they used hints and still got it wrong, suggest how to better use hints. If they didn't use hints on tough questions, suggest that it's a valuable tool. For example: "You effectively used a hint on Question 2 to arrive at the correct answer. For Question 4, where you were incorrect, a hint might have provided the necessary clue."
4.  **Actionable Tips for Improvement**: Provide 2-3 specific, actionable tips to improve their knowledge and strategy. These should be directly related to their performance. Examples: "To improve on player statistics, try following a sports analytics website like ESPNcricinfo Statsguru." or "For time management, practice focusing on keywords in the question before looking at the options."

Maintain a positive, coach-like tone throughout the analysis.

Here is the quiz data:
{{#if totalTime}}Total Time Taken: {{totalTime}} seconds{{/if}}
{{#if totalHintsUsed}}Total Hints Used: {{totalHintsUsed}}{{/if}}

{{#each quizData}}
---
**Question {{this.questionNumber}}**: {{this.questionText}}
*   **Your Answer**: {{this.userAnswer}} ({{#if this.isCorrect}}Correct{{else}}Incorrect{{/if}})
*   **Correct Answer**: {{this.correctAnswer}}
{{#if this.timeTaken}}*   **Time Taken**: {{this.timeTaken}}s{{/if}}
{{#if this.hintUsed}}*   **Hint Used**: Yes{{else}}*   **Hint Used**: No{{/if}}
{{/each}}

Remember, your entire response must be a single JSON object with the "analysis" key containing the markdown string.
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
            isCorrect: input.userAnswers[index] === q.correctAnswer,
            timeTaken: input.timePerQuestion?.[index],
            hintUsed: input.usedHintIndices?.includes(index),
        })),
        totalTime: input.timePerQuestion?.reduce((a, b) => a + b, 0),
        totalHintsUsed: input.usedHintIndices?.length,
    };

    const { output } = await analysisPrompt(promptInput);
    
    if (!output?.analysis) {
      throw new Error("The AI failed to generate a valid analysis object.");
    }

    return output;
  }
);
