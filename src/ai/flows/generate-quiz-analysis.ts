
'use server';

/**
 * @fileOverview A flow that generates an AI-powered analysis of a user's quiz attempt.
 *
 * - generateQuizAnalysis - A function that provides a detailed performance breakdown.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizAttempt, QuizAnalysisOutput, QuizAnalysisOutputSchema } from '@/ai/schemas';
import { sanitizeQuizAttempt } from '@/lib/sanitizeUserProfile';

/**
 * Generates a deterministic, rules-based fallback analysis if the AI fails.
 * @param attempt - The sanitized quiz attempt data.
 * @returns A complete QuizAnalysisOutput object.
 */
const getFallbackAnalysis = (attempt: z.infer<typeof QuizAttempt>): QuizAnalysisOutput => {
    const accuracy = (attempt.score / attempt.totalQuestions) * 100;
    const averageTime = (attempt.timePerQuestion?.reduce((a,b) => a+b, 0) || 0) / attempt.totalQuestions;

    const correctQuestions = attempt.questions.filter((q, i) => q.correctAnswer === attempt.userAnswers[i]);
    const incorrectQuestions = attempt.questions.filter((q, i) => q.correctAnswer !== attempt.userAnswers[i]);

    let strengths = ["Good pace on questions you knew.", "Strong foundational knowledge."];
    if (accuracy > 80) strengths.unshift("Excellent accuracy under pressure!");
    
    let improvements = ["Double-check questions with tricky wording."];
    if (incorrectQuestions.length > 0) {
        improvements.push(`Review topics related to: "${incorrectQuestions[0].question.slice(0, 30)}..."`);
    } else {
        improvements.push("Time management on tougher questions could be improved.");
    }
    
    return {
        overallPerformance: `A solid effort on the ${attempt.format} quiz! You've got a great foundation to build upon.`,
        accuracy: parseFloat(accuracy.toFixed(1)),
        averageTimePerQuestion: parseFloat(averageTime.toFixed(1)),
        keyStrengths: strengths.slice(0,2),
        areasForImprovement: improvements.slice(0,2),
        coachTip: "Before your next quiz, try focusing on one specific era or tournament. This can help you build deeper knowledge in one go!",
        analyzedQuestions: attempt.questions.map((q, i) => ({
            question: q.question,
            userAnswer: attempt.userAnswers[i] || 'Not Answered',
            correctAnswer: q.correctAnswer,
            isCorrect: attempt.userAnswers[i] === q.correctAnswer,
            timeTaken: attempt.timePerQuestion?.[i] || 0,
            category: "General" // Fallback category
        }))
    };
};


export async function generateQuizAnalysis(rawAttempt: any): Promise<QuizAnalysisOutput> {
    // 1. Sanitize the raw input from Firestore/client to handle inconsistencies.
    const sanitized = sanitizeQuizAttempt(rawAttempt);
        
    try {
        // 2. Validate the sanitized data against the strict Zod schema.
        const validatedAttempt = QuizAttempt.parse(sanitized);

        // 3. If validation passes, call the AI flow.
        const analysis = await generateQuizAnalysisFlow(validatedAttempt);
        return analysis;
    } catch (error: any) {
        // Log the validation error and the sanitized data for debugging
        console.error("Validation failed for quiz attempt before AI call. Returning fallback.", {
            // Only log non-sensitive info for privacy
            userId: sanitized.userId,
            slotId: sanitized.slotId,
            format: sanitized.format,
            error: error?.errors ?? error,
        });
        
        // If any step fails (validation or AI), return the deterministic fallback.
        // We can safely cast here because sanitizeQuizAttempt returns a compliant partial.
        return getFallbackAnalysis(sanitized as QuizAttempt);
    }
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
        try {
            const { output } = await prompt(input);
            // If the AI model fails to return a valid output, throw an error to trigger the fallback in the parent function.
            if (!output) {
                throw new Error("AI analysis returned a null or empty response.");
            }
            // Zod parse to ensure the AI output conforms to the schema
            return QuizAnalysisOutputSchema.parse(output);
        } catch (error) {
             console.error("Error during AI analysis flow execution:", error);
             // Re-throw the error to be caught by the parent `generateQuizAnalysis` function, which will then generate the fallback.
             throw error;
        }
    }
);
