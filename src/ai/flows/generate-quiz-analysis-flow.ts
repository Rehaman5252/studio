
'use server';

/**
 * @fileOverview A flow that generates a detailed analysis of a user's quiz performance.
 *
 * - generateQuizAnalysis - a function that provides feedback and improvement tips.
 */
import { ai } from '@/ai/genkit';
import {
    GenerateQuizAnalysisOutput,
    FlowGenerateQuizAnalysisInputSchema,
    GenerateQuizAnalysisOutputSchema,
    GenerateQuizAnalysisPromptInputSchema,
    FlowGenerateQuizAnalysisInput
} from '@/ai/schemas';
import { z } from 'zod';

type GenerateQuizAnalysisPromptInput = z.infer<typeof GenerateQuizAnalysisPromptInputSchema>;

export async function generateQuizAnalysis(input: FlowGenerateQuizAnalysisInput): Promise<GenerateQuizAnalysisOutput> {
  return generateQuizAnalysisFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: GenerateQuizAnalysisPromptInputSchema },
  output: { schema: GenerateQuizAnalysisOutputSchema },
  prompt: `You are 'Coach Cric', a friendly, encouraging, and insightful cricket coach. A user just finished a quiz and you are giving them their performance report. Your feedback must be in markdown format.

Your tone must be positive and motivating, like a real coach talking to a promising player after a practice session. Address the user directly (e.g., "Great work out there!").

Based on the user's performance data, generate a personalized performance report. The report MUST include the following sections:

1.  **Overall Summary:** Start with a brief, encouraging summary of their performance. Mention their final score and the quiz format.
2.  **Key Strength (What Went Well):** Identify one specific area where the user did well. This could be quick answering on the questions they *did* answer, not needing hints, or simply their determination to finish the quiz. **If the score is 0, focus on their effort or speed as a strength.**
3.  **Area for Improvement (Focus for Next Innings):** Identify the single most important area for improvement. Don't just say "incorrect answers." Analyze *why* they might have gotten questions wrong by looking at the incorrectly answered questions (e.g., "It looks like questions about historic Test matches were a bit tricky," or "You were so fast on the buzzer, you might be rushing a bit.").
4.  **Coach's Tip:** Provide one actionable, concrete tip to help them with their area for improvement. For example, "To brush up on your '90s cricket knowledge, try watching the highlights of the 1996 World Cup on YouTube."
5.  **Path to 'Man of the Match':** Conclude with a final encouraging sentence about what they can do to achieve a perfect score next time.

Here is the user's quiz performance data:
- Format: {{format}}
- Score: {{score}}/{{totalQuestions}}
- Time taken per question (seconds): {{json timePerQuestion}}
- Hints used on question indices: {{json usedHintIndices}}
- Incorrectly answered questions, their answers, and the correct answers: {{json incorrectAnswers}}
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

// Fallback Markdown Generator
function getFallbackAnalysis(score: number, total: number, format: string): GenerateQuizAnalysisOutput {
  return {
    analysis: `### Analysis Currently Unavailable

We couldn't generate a detailed AI analysis for this quiz at the moment. This can happen occasionally due to high traffic.

**Your Score:** ${score}/${total} in the ${format} quiz.

You can try generating the analysis again from your Quiz History later. Keep up the great effort! 🏏`,
  };
}

const generateQuizAnalysisFlow = ai.defineFlow(
  {
    name: 'generateQuizAnalysisFlow',
    inputSchema: FlowGenerateQuizAnalysisInputSchema,
    outputSchema: GenerateQuizAnalysisOutputSchema,
  },
  async (input: FlowGenerateQuizAnalysisInput) => {
    const { questions, userAnswers, format, timePerQuestion, usedHintIndices } = input;
    const score = userAnswers.reduce((acc, ans, idx) => (ans === questions[idx].correctAnswer ? acc + 1 : acc), 0);
    const totalQuestions = questions.length;
    
    try {
        const incorrectAnswers = questions
            .map((q, idx) => ({
              questionNumber: idx + 1,
              questionText: q.questionText,
              userAnswer: userAnswers[idx] || "Not Answered",
              correctAnswer: q.correctAnswer
            }))
            .filter((q, idx) => userAnswers[idx] !== questions[idx].correctAnswer);

        const promptInput: GenerateQuizAnalysisPromptInput = {
            format,
            score,
            totalQuestions,
            incorrectAnswers,
            timePerQuestion: timePerQuestion || [],
            usedHintIndices: usedHintIndices || [],
        };
        
        const { output } = await analysisPrompt(promptInput);

        if (output?.analysis && output.analysis.trim().length > 50) {
            return output;
        }

        console.warn('⚠️ Analysis output was empty or too short. Returning fallback.');
        return getFallbackAnalysis(score, totalQuestions, format);

    } catch (err) {
      console.error('❌ generateQuizAnalysisFlow failed:', err);
      return getFallbackAnalysis(score, totalQuestions, format);
    }
  }
);
