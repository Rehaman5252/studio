
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
  QuizQuestionSchema,
} from '@/ai/schemas';

export async function generateQuiz(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

// Use a more lenient schema for the prompt response, as the AI may not return exactly 5 questions.
const LenientGenerateQuizOutputSchema = z.array(QuizQuestionSchema);

const quizGenerationPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    input: { schema: GenerateQuizInputSchema },
    // Use the lenient schema for the AI's direct output.
    output: { schema: LenientGenerateQuizOutputSchema },
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
    // The flow itself still promises to return exactly 5 questions to the client.
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await quizGenerationPrompt(input);
    
    if (!output || output.length < 5) {
      console.error('AI failed to generate a sufficient number of questions.', {
        count: output?.length,
      });
      throw new Error('AI failed to generate a complete quiz. Please try again.');
    }
    
    // Take the first 5 questions and shuffle the options for each.
    const finalQuestions = output.slice(0, 5).map(q => ({
      ...q,
      options: q.options.sort(() => Math.random() - 0.5),
    }));

    // This return value will be validated against the flow's strict outputSchema.
    return finalQuestions;
  }
);
