
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
  prompt: `Generate a 5-question, multiple-choice, text-only quiz about "{{format}}" cricket with a clear difficulty progression. The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The 5 questions must follow this exact structure:

1.  **Question 1 (Easy):** A text-based question about a basic, accessible fact (famous player, major tournament winner, or well-known venue) related to the "{{format}}" format.
2.  **Question 2 (Medium):** A text-based question about a common record, a well-known team score, or a top scorer in a specific series/tournament within the "{{format}}" format.
3.  **Question 3 (Hard):** A text-based question about a more detailed topic like player-vs-player statistics, how match conditions influenced a famous game, or a specific milestone inning in the "{{format}}" format.
4.  **Question 4 (Very Hard):** A text-based question about a rare record, a low-profile but significant match, or a lesser-known player's achievement in the "{{format}}" format.
5.  **Question 5 (Extreme Hard):** A deeply obscure text-based trivia question about historic player comparisons, a rare form of dismissal, specific debut match statistics, or a high-pressure situation from the "{{format}}" format.
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

const mixedFormatPrompt = ai.definePrompt({
    name: 'generateMixedQuizPrompt',
    input: {schema: GenerateQuizInputSchema},
    output: {schema: GenerateQuizOutputSchema},
    prompt: `Generate a 5-question, multiple-choice, text-only quiz covering T20, IPL, WPL, ODI, and Test cricket, with a clear difficulty progression. The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The 5 questions must follow this exact difficulty structure, with each question drawn from a *different* format:

1.  **Question 1 (Easy):** A text-based question about a basic, accessible fact (famous player, major tournament winner, or well-known venue).
2.  **Question 2 (Medium):** A text-based question about a common record, a well-known team score, or a top scorer in a specific series/tournament.
3.  **Question 3 (Hard):** A text-based question about a more detailed topic like player-vs-player statistics, how match conditions influenced a famous game, or a specific milestone inning.
4.  **Question 4 (Very Hard):** A text-based question about a rare record, a low-profile but significant match, or a lesser-known player's achievement.
5.  **Question 5 (Extreme Hard):** A deeply obscure text-based trivia question about historic player comparisons, a rare form of dismissal, specific debut match statistics, or a high-pressure situation.
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
    const promptToUse = input.format === 'Mixed' ? mixedFormatPrompt : generalPrompt;
    const {output} = await promptToUse(input);
    if (!output || !output.questions || output.questions.length !== 5) {
      throw new Error("The AI failed to generate a valid 5-question quiz.");
    }

    return output;
  }
);
