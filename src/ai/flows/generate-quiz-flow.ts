'use server';
/**
 * @fileOverview A flow that generates a cricket quiz using an AI model.
 *
 * - generateQuiz - A function that generates 5 quiz questions based on a format and brand.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
  GenerateQuizInput,
  GenerateQuizOutput,
} from '@/ai/schemas';

export async function generateQuiz(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const quizGenerationPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    input: { schema: GenerateQuizInputSchema },
    output: { schema: GenerateQuizOutputSchema },
    prompt: `You are a cricket trivia expert. Generate a list of 5 unique and challenging quiz questions about the sport of cricket.

The user has selected the following parameters for their quiz:
- Format: {{{format}}}
- Sponsoring Brand: {{{brand}}}

Tailor the questions to the selected format. The questions should be difficult and require deep knowledge of cricket. For each question, provide:
1. "questionText": The question itself.
2. "options": An array of 4 plausible options. One must be correct.
3. "correctAnswer": The single correct answer, which must exactly match one of the provided options.
4. "hint": A helpful, single-sentence hint that does not give away the answer directly.
5. "explanation": A brief, one-to-two sentence explanation of why the correct answer is right.`,
    config: {
        safetySettings: [
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_ONLY_HIGH',
            },
        ],
    },
});


const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await quizGenerationPrompt(input);
    
    if (!output) {
      throw new Error('AI failed to generate quiz questions.');
    }
    
    // The output should already be parsed and validated by the prompt definition.
    // Let's add an extra shuffle of the options for each question for more variety.
    return output.map(q => ({
      ...q,
      options: q.options.sort(() => Math.random() - 0.5),
    }));
  }
);
