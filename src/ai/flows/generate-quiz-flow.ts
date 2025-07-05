
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
  prompt: `You are a cricket trivia expert. Your task is to generate a challenging 5-question quiz about cricket.

The user has requested a quiz for the following format and brand:
- Format: {{{format}}}
- Brand: {{{brand}}}

Please generate 5 unique and very difficult trivia questions related to the specified format. For each question, provide:
1.  A clear and concise question ("questionText").
2.  An array of exactly four plausible options ("options"). One must be correct.
3.  The single correct answer ("correctAnswer"), which must exactly match one of the provided options.
4.  A helpful, single-sentence hint ("hint") that guides the user without giving away the answer directly.
5.  A brief explanation ("explanation") of why the correct answer is right.

The questions should be challenging even for avid cricket fans. Ensure the tone is engaging and fun.
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
