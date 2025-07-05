
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

// Internal schema for the prompt itself. This will now be the output of the prompt.
// By asking for a structured object, we increase the reliability of the AI's response.
const PromptOutputSchema = z.object({
    analysis: z.string().describe('A detailed analysis of the user quiz performance, formatted as a single markdown string. The analysis should be encouraging and cover: overall performance, areas for improvement based on incorrect answers, and one actionable tip.'),
});

// The prompt will take a simple, manually constructed string as input to reduce complexity.
const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: z.string() },
  output: { schema: PromptOutputSchema },
  prompt: `You are an expert cricket coach. A user has just completed a quiz. Based on the following summary of their performance, generate a personalized performance report as a single, raw markdown-formatted string and place it inside the 'analysis' field of the JSON output.

The analysis MUST be encouraging and cover these sections:
1.  **Overall Performance**: Start with a summary of their score.
2.  **Areas for Improvement**: Based on the incorrect answers, identify 1-2 specific topics for the user to study.
3.  **Actionable Tip**: Provide one specific, actionable tip for improvement.

Maintain a positive, coach-like tone.

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
    // The flow's external contract still returns the structured object.
    outputSchema: GenerateQuizAnalysisOutputSchema,
  },
  async (input) => {
    // Manually construct the prompt string for maximum reliability.
    const score = input.questions.reduce((acc, q, index) => 
        (input.userAnswers[index] === q.correctAnswer) ? acc + 1 : acc, 0);
    
    // Simple format detection from the first question.
    const format = input.format || (input.questions[0]?.questionText.includes('IPL') ? 'IPL' : (input.questions[0]?.questionText.includes('Test') ? 'Test' : 'General Cricket'));

    // Create a summary of incorrect answers.
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

    const promptInputString = `Format: ${format}\nScore: ${score}/${input.questions.length}\n\nIncorrect Answers:\n${incorrectAnswersSummary}`;
    
    // The prompt function returns a promise for the structured object.
    const { output } = await analysisPrompt(promptInputString);
    
    // This is the critical fix: Check if the AI returned a valid object with a non-empty analysis string.
    if (!output || !output.analysis || output.analysis.trim() === '') {
      console.error("AI analysis returned a null or empty analysis string.", { output });
      throw new Error("The AI failed to generate a valid analysis. The response was empty.");
    }

    // The output from the prompt is already in the correct format { analysis: '...' } required by the flow's outputSchema.
    return output;
  }
);
