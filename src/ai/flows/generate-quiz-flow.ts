
'use server';
/**
 * @fileOverview A flow that generates a 5-question cricket quiz for a specific format.
 *
 * - generateQuiz - A function that handles the quiz generation process.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
  GenerateQuizInput,
  GenerateQuizOutput
} from '@/ai/schemas';

export {GenerateQuizInput, GenerateQuizOutput};

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},

  prompt: `You are a master cricket quiz creator. Generate a new, unique, and challenging 5-question multiple-choice quiz about the "{{format}}" cricket format.

  **Instructions:**
  1.  **Format Specificity:** All questions must be strictly related to the "{{format}}" format. Do not include questions about other formats.
  2.  **Question Quality:** Questions should be interesting, non-trivial, and cover a range of topics within the format (e.g., players, records, history, rules).
  3.  **Unique Questions:** The user with ID "{{userId}}" will be taking this quiz. Do your best to provide questions they haven't seen recently.
  4.  **Answer & Explanation:** Provide a clear correct answer and a concise, informative explanation for each question. The correct answer MUST be one of the four options.
  5.  **Brand Neutrality:** Do not mention any brands or sponsors in the questions, options, or explanations.
  6.  **Output Format:** Ensure the output is a valid JSON object matching the provided schema, containing exactly 5 questions.
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
  async (input: GenerateQuizInput) => {
    // Adding a timeout to the AI call for resilience.
    const generatePromise = prompt(input);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out after 15 seconds.')), 15000)
    );
    
    try {
        const result = await Promise.race([generatePromise, timeoutPromise]) as any; // Cast to any to access .output
        const quiz = result.output;
        
        // Validate the output from the AI
        if (!quiz || !quiz.questions || quiz.questions.length !== 5) {
            throw new Error('AI returned invalid or incomplete quiz data.');
        }

        // Further validation to ensure questions have all required fields.
        for (const q of quiz.questions) {
            if (!q.question || !q.options || q.options.length !== 4 || !q.correctAnswer || !q.explanation) {
                throw new Error('AI returned a malformed question object.');
            }
             if (!q.id) {
                q.id = `gen-${Math.random().toString(36).substring(2, 9)}`;
            }
            q.format = input.format; // Ensure format consistency
        }

        return quiz;
    } catch (error) {
        console.error("Error in generateQuizFlow:", error);
        // We re-throw the error to be caught by the API route's catch block,
        // which will then serve the fallback quiz.
        throw error;
    }
  }
);
