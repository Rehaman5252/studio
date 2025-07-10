
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

const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: z.string() },
  output: { format: 'string' },
  prompt: `You are 'Coach Cric', a friendly, encouraging, and insightful cricket coach. A user just finished a quiz and you are giving them their performance report. Your feedback must be in markdown format.

Your tone should be positive and motivating, like a real coach talking to a promising player after a practice session. Address the user directly (e.g., "Great work out there!").

Based on the user's performance data below, generate a personalized performance report. The report MUST include the following sections:

1.  **Overall Summary:** Start with a brief, encouraging summary of their performance. Mention their final score.
2.  **Key Strength (What Went Well):** Identify one specific area where the user did well. This could be quick answering, getting tough questions right, or not needing hints. Be specific.
3.  **Area for Improvement (Focus for Next Innings):** Identify the single most important area for improvement. Don't just say "incorrect answers." Analyze *why* they might have gotten questions wrong (e.g., "It looks like questions about historic Test matches were a bit tricky," or "You were so fast on the buzzer, you might be rushing a bit.").
4.  **Coach's Tip:** Provide one actionable, concrete tip to help them with their area for improvement. For example, "To brush up on your '90s cricket knowledge, try watching the highlights of the 1996 World Cup on YouTube."
5.  **Path to 'Man of the Match':** Conclude with a final encouraging sentence about what they can do to achieve a perfect score next time.

Here is the user's quiz performance data:
{{{_input}}}
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
            `Question ${q.questionNumber}: "${q.questionText}"\n  - Your Answer: ${q.userAnswer}\n  - Correct Answer: ${q.correctAnswer}`
        ).join('\n\n');
    }
    
    // Construct the detailed performance data string for the prompt
    const totalTime = input.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;
    let performanceData = `
Format: ${format}
Score: ${score}/${input.questions.length}
Total Time Taken: ${totalTime.toFixed(1)} seconds
Average Time Per Question: ${(totalTime / input.questions.length).toFixed(1)} seconds
`;

    if (input.usedHintIndices && input.usedHintIndices.length > 0) {
        performanceData += `\nHints Used on Questions: ${input.usedHintIndices.map(i => i + 1).join(', ')}`;
    } else {
        performanceData += `\nHints Used: None`;
    }

    performanceData += `\n\nIncorrect Answers:\n${incorrectAnswersSummary}`;
    
    console.log("Attempting to generate AI analysis with the following data:", performanceData);
    try {
        const { output } = await analysisPrompt(performanceData);
    
        if (!output || output.trim() === '' || output.trim().length < 50) {
          // This case handles when the AI returns an empty or very short (likely useless) string.
          console.warn("AI analysis returned a null or insufficient analysis string. Providing a fallback response.", { output });
          throw new Error("Insufficient analysis from AI");
        } else {
            // If we got a valid output, return it.
            console.log("Successfully generated AI analysis.");
            return { analysis: output };
        }

    } catch (error) {
        // This case handles when the analysisPrompt() call itself throws an error or we throw it above.
        console.error("AI analysis call failed. Providing a fallback response.", { error });
    }

    // This is the fallback logic. It's reached if the AI returns empty/null OR if the AI call throws an error.
    const fallbackAnalysis = `### Analysis Currently Unavailable

We couldn't generate a detailed AI analysis for this quiz at the moment. This can happen occasionally due to high traffic.

**Your Score:** ${score}/${input.questions.length}

You can try generating the analysis again from your Quiz History later.
`;
    return { analysis: fallbackAnalysis };
  }
);
