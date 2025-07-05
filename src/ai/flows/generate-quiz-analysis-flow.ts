
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

// The prompt will now be simpler, just asking for a raw markdown string.
const analysisPrompt = ai.definePrompt({
  name: 'generateQuizAnalysisPrompt',
  input: { schema: z.string() },
  // Request a raw string output, not a JSON object. This is more reliable.
  output: { format: 'string' },
  prompt: `You are an expert cricket coach. A user has just completed a quiz. Based on the following summary of their performance, generate a personalized performance report as a single, raw markdown-formatted string.

The analysis MUST be encouraging and cover these sections:
1.  **Overall Performance**: Start with a summary of their score.
2.  **Areas for Improvement**: Based on the incorrect answers, identify 1-2 specific topics for the user to study.
3.  **Actionable Tip**: Provide one specific, actionable tip for improvement.

Maintain a positive, coach-like tone. DO NOT wrap your response in JSON or any other special formatting.

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
    
    // The prompt function now returns a promise for a raw string.
    const { output } = await analysisPrompt(promptInputString);
    
    // Validate that we got a non-empty string back.
    if (!output || output.trim() === '') {
      console.error("AI analysis returned a null or empty analysis string.", { output });
      throw new Error("The AI failed to generate a valid analysis. The response was empty.");
    }

    // Wrap the raw string output into the object format required by the flow's outputSchema.
    return { analysis: output };
  }
);
