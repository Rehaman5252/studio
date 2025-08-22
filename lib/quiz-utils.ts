'use client';

import type { QuizAttempt, QuizData } from '@/ai/schemas';
import type { User } from 'firebase/auth';
import { getQuizSlotId } from '@/lib/utils';

/**
 * Encodes a QuizAttempt object into a Base64 string for URL transport.
 */
export const encodeAttempt = (attempt: QuizAttempt): string => 
     encodeURIComponent(btoa(JSON.stringify(attempt)));


interface BuildAttemptArgs {
    user: User;
    quizData: QuizData & { source?: 'ai' | 'fallback' };
    brand: string;
    format: string;
    userAnswers: string[];
    timePerQuestion: number[];
    overrides?: Partial<QuizAttempt>;
}

/**
 * Constructs a fully-formed QuizAttempt object.
 */
export const buildAttempt = ({
    user,
    quizData,
    brand,
    format,
    userAnswers,
    timePerQuestion,
    overrides = {},
}: BuildAttemptArgs): QuizAttempt => {
    const score = overrides.score ?? quizData.questions.reduce((acc, q, i) => userAnswers[i] === q.correctAnswer ? acc + 1 : acc, 0);
    
    const unansweredCount = Math.max(0, quizData.questions.length - userAnswers.length);

    return {
        userId: user.uid,
        slotId: getQuizSlotId(),
        brand,
        format,
        questions: quizData.questions,
        userAnswers,
        score,
        totalQuestions: quizData.questions.length,
        timestamp: Date.now(),
        timePerQuestion,
        source: quizData.source,
        unanswered: unansweredCount,
        ...overrides,
    };
};
