
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

const generalPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `Generate 5 exceptionally difficult multiple-choice quiz questions about "{{format}}" cricket. The questions must be for experts, focusing on specific statistics (runs, averages, strike rates), obscure records, historic match details, and lesser-known player achievements. The options should be very similar and plausible to truly test deep knowledge. The questions must be strictly about the sport and not mention any brands or sponsors.`,
  config: {
    model: 'googleai/gemini-2.0-flash',
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

const mixedFormatPrompt = ai.definePrompt({
    name: 'generateMixedQuizPrompt',
    input: {schema: GenerateQuizInputSchema},
    output: {schema: GenerateQuizOutputSchema},
    prompt: `Generate a 5-question, exceptionally difficult multiple-choice quiz with exactly one question from each of the following cricket formats: T20, IPL, WPL, ODI, and Test. Each question must be for experts, focusing on specific statistics (runs, averages, strike rates), obscure records, historic match details, and lesser-known player achievements. The options should be very similar and plausible to truly test deep knowledge. The questions must be strictly about the sport and not mention any brands or sponsors.`,
    config: {
      model: 'googleai/gemini-2.0-flash',
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
    const promptToUse = input.format === 'Mixed' ? mixedFormatPrompt : generalPrompt;
    const {output} = await promptToUse(input);
    if (!output) {
      throw new Error("The AI failed to generate quiz questions.");
    }
    return output;
  }
);
