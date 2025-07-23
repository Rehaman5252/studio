
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
  prompt: `Generate a 5-question, multiple-choice quiz about "{{format}}" cricket with a clear difficulty progression. The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The 5 questions must follow this exact difficulty structure:

1.  **Question 1 (Easy):** A text-based question about a basic, accessible fact (famous player, major tournament winner, or well-known venue) related to the "{{format}}" format. Set questionType to "text".
2.  **Question 2 (Medium):** A text-based question about a common record, a well-known team score, or a top scorer in a specific series/tournament within the "{{format}}" format. Set questionType to "text".
3.  **Question 3 (Hard):** A text-based question about a more detailed topic like player-vs-player statistics, how match conditions influenced a famous game, or a specific milestone inning in the "{{format}}" format. Set questionType to "text".
4.  **Question 4 (Very Hard / Image-based):** An image-based question. The questionText should ask to identify something in an image (e.g., "Identify the player in this photo," "Which stadium is this?"). Set questionType to "image". Provide a descriptive two-word 'imageAiHint' (e.g., "Rohit Sharma batting", "Lords stadium") that can be used to find a relevant photo. DO NOT provide an actual imageUrl.
5.  **Question 5 (Extreme Hard):** A deeply obscure text-based trivia question about historic player comparisons, a rare form of dismissal, specific debut match statistics, or a high-pressure situation from the "{{format}}" format. Set questionType to "text".
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
    prompt: `Generate a 5-question, multiple-choice quiz covering T20, IPL, WPL, ODI, and Test cricket, with a clear difficulty progression. The questions must be strictly about the sport and not mention any brands or sponsors. The options should be plausible but with one clear correct answer.

The 5 questions must follow this exact difficulty structure, with each question drawn from a *different* format:

1.  **Question 1 (Easy):** A text-based question about a basic, accessible fact (famous player, major tournament winner, or well-known venue). Set questionType to "text".
2.  **Question 2 (Medium):** A text-based question about a common record, a well-known team score, or a top scorer in a specific series/tournament. Set questionType to "text".
3.  **Question 3 (Hard):** A text-based question about a more detailed topic like player-vs-player statistics, how match conditions influenced a famous game, or a specific milestone inning. Set questionType to "text".
4.  **Question 4 (Very Hard / Image-based):** An image-based question. The questionText should ask to identify something in an image (e.g., "Identify the player in this action shot," "Which famous ground is shown here?"). Set questionType to "image". Provide a descriptive two-word 'imageAiHint' (e.g., "MS Dhoni keeping", "MCG stadium") that can be used to find a relevant photo. DO NOT provide an actual imageUrl.
5.  **Question 5 (Extreme Hard):** A deeply obscure text-based trivia question about historic player comparisons, a rare form of dismissal, specific debut match statistics, or a high-pressure situation. Set questionType to "text".
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
    if (!output) {
      throw new Error("The AI failed to generate quiz questions.");
    }
    
    // Process questions to add placeholder image URLs where needed
    const processedQuestions = output.questions.map(q => {
        if (q.questionType === 'image' && q.imageAiHint && !q.imageUrl) {
            // Use placehold.co for image generation based on hint.
            // Replace spaces in hint with '+' for URL compatibility.
            // Example hint: "sachin tendulkar" -> "sachin+tendulkar"
            const hintText = q.imageAiHint.replace(/\s+/g, '+');
            return {
                ...q,
                imageUrl: `https://placehold.co/600x400.png`
            };
        }
        return q;
    });

    return { questions: processedQuestions };
  }
);
