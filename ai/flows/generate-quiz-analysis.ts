
'use server';

/**
 * @fileOverview A flow that generates an AI-powered analysis of a user's quiz attempt.
 *
 * - generateQuizAnalysis - A function that provides a detailed performance breakdown.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizAttempt } from '@/ai/schemas';

const QuestionAnalysisSchema = z.object({
    question: z.string().describe("The original question text."),
    userAnswer: z.string().describe("The answer the user provided."),
    correctAnswer: z.string().describe("The correct answer."),
    isCorrect: z.boolean().describe("Whether the user's answer was correct."),
    timeTaken: z.number().describe("Time taken for this question in seconds."),
    category: z.string().describe("A specific category for the question (e.g., 'IPL History', 'Test Bowling Records', 'Player Nicknames', 'Cricket Rules').")
});

const QuizAnalysisOutputSchema = z.object({
    overallPerformance: z.string().describe("A brief, encouraging summary of the user's overall performance in one or two sentences."),
    accuracy: z.number().describe("The user's accuracy percentage."),
    averageTimePerQuestion: z.number().describe("The average time the user took per question, in seconds."),
    keyStrengths: z.array(z.string()).describe("A list of 2-3 key strengths the user demonstrated, based on the categories they answered correctly and quickly."),
    areasForImprovement: z.array(z.string()).describe("A list of 2-3 specific, actionable areas for improvement, based on the categories they answered incorrectly or slowly."),
    coachTip: z.string().describe("A single, personalized, actionable tip from an AI coach to help the user improve next time."),
    analyzedQuestions: z.array(QuestionAnalysisSchema).describe("An array containing the analysis for each individual question.")
});
export type QuizAnalysisOutput = z.infer<typeof QuizAnalysisOutputSchema>;


export async function generateQuizAnalysis(input: QuizAttempt): Promise<QuizAnalysisOutput> {
    const analysis = await generateQuizAnalysisFlow(input);
    return analysis;
}

const prompt = ai.definePrompt({
    name: 'generateQuizAnalysisPrompt',
    input: { schema: QuizAttempt },
    output: { schema: QuizAnalysisOutputSchema },
    prompt: `
    You are an expert cricket quiz analyst and coach. Your goal is to provide an insightful, detailed, and helpful performance analysis for a user based on their recent quiz attempt. Be encouraging but also provide concrete, actionable feedback.

    Analyze the following quiz data for the "{{format}}" format:
    - Score: {{score}} out of {{totalQuestions}}
    - Questions, User Answers, and Time Taken:
      {{#each questions}}
      - Q{{@index + 1}}: {{this.question}}
        - Your Answer: {{../userAnswers.[@index]}}
        - Correct Answer: {{this.correctAnswer}}
        - Time Taken: {{../timePerQuestion.[@index]}}s
      {{/each}}

    Based on this data, generate a comprehensive analysis. Follow these steps:
    1.  **Calculate Metrics:** Determine the overall accuracy percentage and the average time per question.
    2.  **Categorize Each Question:** For each question, assign a specific, granular category. Examples: 'IPL Batting Records', 'Test Match History', 'Cricket Terminology', 'Player Nicknames', 'World Cup 2011'.
    3.  **Overall Summary:** Write a brief, encouraging summary of the user's performance.
    4.  **Identify Strengths:** Based on the question categories answered correctly and quickly, identify 2-3 key strengths.
    5.  **Identify Improvement Areas:** Based on the categories where answers were incorrect or slow, identify 2-3 areas for improvement.
    6.  **Provide a Coach's Tip:** Give one single, powerful, and personalized tip for the user to focus on for their next quiz.
    7.  **Format Output:** Compile all this information into the required JSON format, including the detailed analysis for every single question.
  `,
});


const generateQuizAnalysisFlow = ai.defineFlow(
    {
        name: 'generateQuizAnalysisFlow',
        inputSchema: QuizAttempt,
        outputSchema: QuizAnalysisOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);

        if (!output) {
            const accuracy = (input.score / input.totalQuestions) * 100;
            const averageTime = (input.timePerQuestion?.reduce((a,b) => a+b, 0) || 0) / input.totalQuestions;
            // Fallback logic in case the AI fails
            return {
                overallPerformance: "A solid effort! You've got a great foundation to build upon. Review your answers below.",
                accuracy: parseFloat(accuracy.toFixed(1)),
                averageTimePerQuestion: parseFloat(averageTime.toFixed(1)),
                keyStrengths: ["Good pace on questions you knew.", "Strong foundational knowledge."],
                areasForImprovement: ["Double-check questions with tricky wording.", "Time management on tougher questions could be improved."],
                coachTip: "Before your next quiz, try focusing on one specific era or tournament. This can help you build deeper knowledge in one go!",
                analyzedQuestions: input.questions.map((q, i) => ({
                    question: q.question,
                    userAnswer: input.userAnswers[i],
                    correctAnswer: q.correctAnswer,
                    isCorrect: input.userAnswers[i] === q.correctAnswer,
                    timeTaken: input.timePerQuestion?.[i] || 0,
                    category: "General"
                }))
            };
        }

        return output;
    }
);

