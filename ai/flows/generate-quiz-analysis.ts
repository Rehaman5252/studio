
'use server';

/**
 * @fileOverview A flow that generates an AI-powered analysis of a user's quiz attempt.
 *
 * - generateQuizAnalysis - A function that provides a detailed performance breakdown.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizAttempt } from '@/ai/schemas';

const QuizAnalysisOutputSchema = z.object({
    overallPerformance: z.string().describe("A brief, encouraging summary of the user's overall performance in one or two sentences."),
    keyStrengths: z.array(z.string()).describe("A list of 2-3 key strengths the user demonstrated (e.g., speed, accuracy in a specific topic)."),
    areasForImprovement: z.array(z.string()).describe("A list of 2-3 specific, actionable areas for improvement (e.g., time management on difficult questions, knowledge gaps)."),
    smartTips: z.array(z.string()).describe("A list of 2-3 clever tips or strategies the user can employ in future quizzes to maximize their score and speed."),
});
export type QuizAnalysisOutput = z.infer<typeof QuizAnalysisOutputSchema>;


export async function generateQuizAnalysis(input: QuizAttempt): Promise<QuizAnalysisOutput> {
    const analysis = await generateQuizAnalysisFlow(input);
    return analysis;
}

const prompt = ai.definePrompt({
    name: 'generateQuizAnalysisPrompt',
    input: { schema: QuizAttempt.extend({ totalTime: z.string().optional() }) },
    output: { schema: QuizAnalysisOutputSchema },
    prompt: `
    You are an expert cricket quiz analyst and coach. Your goal is to provide an insightful and helpful performance analysis for a user based on their recent quiz attempt. Be encouraging but also provide concrete, actionable feedback.

    Analyze the following quiz data:
    - Format: {{format}}
    - Score: {{score}} out of {{totalQuestions}}
    - Questions, User Answers, Correct Answers, and Explanations:
      {{#each questions}}
      - Q{{@index + 1}}: {{this.question}}
        - Your Answer: {{../userAnswers.[@index]}} ({{#if (eq ../userAnswers.[@index] this.correctAnswer)}}Correct{{else}}Incorrect{{/if}})
        - Correct Answer: {{this.correctAnswer}}
        - Time Taken: {{../timePerQuestion.[@index]}}s
      {{/each}}
    - Total time for answered questions: {{totalTime}}s

    Based on this data, generate a concise analysis covering these four areas:
    1.  **Overall Performance:** A brief, encouraging summary of the user's performance.
    2.  **Key Strengths:** Identify 2-3 positive aspects. This could be speed on correct answers, knowledge in a specific area (deduced from questions), or consistency.
    3.  **Areas for Improvement:** Identify 2-3 areas where the user could improve. Focus on patterns, like spending too much time on wrong answers, or a specific type of question they got wrong. Be specific and constructive.
    4.  **Smart Tips:** Provide 2-3 actionable strategies for the next quiz. For example, "For questions about player records, try to associate the player with their era first to narrow down options." or "If unsure, the process of elimination is your best friend. Quickly rule out one or two options."

    Generate the analysis in the format requested.
  `,
});


const generateQuizAnalysisFlow = ai.defineFlow(
    {
        name: 'generateQuizAnalysisFlow',
        inputSchema: QuizAttempt,
        outputSchema: QuizAnalysisOutputSchema,
    },
    async (input) => {
        const totalTime = input.timePerQuestion?.reduce((acc, time) => acc + time, 0) ?? 0;
        
        const { output } = await prompt({
            ...input,
            totalTime: totalTime.toFixed(1),
        });

        if (!output) {
            // Fallback logic in case the AI fails
            return {
                overallPerformance: "A solid effort! You've got a great foundation to build upon.",
                keyStrengths: ["Good pace on questions you knew.", "Strong foundational knowledge."],
                areasForImprovement: ["Double-check questions with tricky wording.", "Time management on tougher questions could be improved."],
                smartTips: ["Use the process of elimination to increase your odds on tricky questions.", "Don't be afraid to trust your first instinct."]
            };
        }

        return output;
    }
);
