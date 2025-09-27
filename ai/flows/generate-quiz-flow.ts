
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { QuizData } from '@/ai/schemas';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';


const GenerateQuizInputSchema = z.object({
    format: z.string().describe('The cricket format for the quiz (e.g., T20, IPL, Test).'),
    userId: z.string().describe('The ID of the user requesting the quiz to avoid repeating questions.'),
});
type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;


const getRecentQuestions = async (userId: string): Promise<string[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, 'users', userId, 'quizAttempts'),
            orderBy('timestamp', 'desc'),
            limit(5)
        );
        const querySnapshot = await getDocs(q);
        const seenQuestions = new Set<string>();
        querySnapshot.forEach(doc => {
            const attempt = doc.data();
            if (attempt.questions) {
                attempt.questions.forEach((question: any) => {
                    if(question && typeof question.question === 'string') {
                      seenQuestions.add(question.question);
                    }
                });
            }
        });
        return Array.from(seenQuestions);
    } catch (error) {
        console.error("Error fetching recent questions:", error);
        return [];
    }
}

const prompt = ai.definePrompt({
    name: 'generateQuizPrompt',
    input: {
        schema: z.object({
            format: z.string(),
            seenQuestions: z.array(z.string()),
        }),
    },
    output: { schema: QuizData },
    prompt: `
    You are a world-class cricket expert and quizmaster. Your task is to generate a completely new and unique 5-question multiple-choice quiz about "{{format}}" cricket.

    ## Rule 1: Progressive Difficulty Curve
    The five questions MUST have an escalating difficulty. Adhere to this structure precisely:
    - **Question 1 (Easy):** A straightforward question that a casual cricket fan would likely know.
    - **Question 2 (Medium):** A question that requires a bit more than surface-level knowledge.
    - **Question 3 (Difficult):** A question about a specific record, event, or player stat that requires deeper knowledge.
    - **Question 4 (Very Hard):** A question about an obscure or less-known fact, rule, or historical event.
    - **Question 5 (Extremely Hard / "The GOAT Question"):** A truly expert-level question. This should be a very specific, almost unanswerable piece of trivia that only a cricket historian or statistician might know.

    ## Rule 2: Balanced Topic Coverage
    You must pull questions from a variety of topics to ensure the quiz is well-rounded. Do not ask multiple questions about the same player or team.

    ## Rule 3: Output Format & Uniqueness
    Each question must include:
    - A unique ID (a short random string like "q1a2b").
    - The question text.
    - An array of 4 distinct string options.
    - The correct answer, which must exactly match one of the options.
    - A brief, engaging explanation for the correct answer.

    ## Rule 4: Avoid Repetition
    This is critical. Do NOT generate any questions that are similar in theme or answer to the questions in this list of recently seen questions:
    {{#if seenQuestions}}
    {{#each seenQuestions}}
    - "{{this}}"
    {{/each}}
    {{/if}}

    Now, generate the 5-question quiz based on all these rules for the "{{format}}" format.
  `,
    config: {
        retries: 2,
    }
});


export const generateQuizFlow = ai.defineFlow(
    {
        name: 'generateQuizFlow',
        inputSchema: GenerateQuizInputSchema,
        outputSchema: QuizData,
    },
    async (input: GenerateQuizInput) => {
        const seenQuestions = await getRecentQuestions(input.userId);

        const { output } = await prompt({ format: input.format, seenQuestions });
        
        const validation = QuizData.safeParse(output);
        if (!validation.success) {
             console.error("AI failed to generate a valid quiz shape. Full output:", JSON.stringify(output, null, 2));
             // Throwing an error here will be caught by the API route and trigger the fallback.
             throw new Error("AI returned incomplete or invalid quiz data.");
        }

        return validation.data;
    }
);
