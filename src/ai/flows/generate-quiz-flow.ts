
'use server';

/**
 * @fileOverview A flow that generates a 5-question quiz on a given cricket topic.
 *
 * - generateQuiz - A function that generates a quiz.
 */
import {ai} from '@/ai/genkit';
import {
    GenerateQuizInput,
    GenerateQuizOutput,
    GenerateQuizInputSchema,
    GenerateQuizOutputSchema,
} from '@/ai/schemas';

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `Generate 5 multiple-choice quiz questions about "{{format}}" cricket.

For each question, provide the following fields: "questionText", "options" (an array of 4), "correctAnswer", "hint" (optional), and "explanation" (optional).

The questions must be strictly about the sport and not mention any brands or sponsors.`,
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

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate quiz questions.");
    }
    return output;
  }
);
