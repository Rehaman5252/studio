
'use client';

import type { QuizAttempt, QuizData } from '@/ai/schemas';
import type { User } from 'firebase/auth';
import { getQuizSlotId } from '@/lib/utils';
import { sanitizeQuizAttempt as sanitizeAttemptData } from './sanitizeUserProfile';

interface BuildAttemptArgs {
    user: User;
    quizData: QuizData;
    brand: string;
    format: string;
    userAnswers: string[];
    timePerQuestion: number[];
    overrides?: Partial<QuizAttempt>;
    source: 'ai' | 'fallback';
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
    source,
}: BuildAttemptArgs): QuizAttempt => {
    const score = overrides.score ?? quizData.questions.reduce((acc, q, i) => userAnswers[i] === q.correctAnswer ? acc + 1 : acc, 0);
    
    const unansweredCount = userAnswers.filter(a => a === "").length;

    const attemptObject: QuizAttempt = {
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
        source,
        unanswered: unansweredCount,
        reviewed: false, // Always initialize as not reviewed
        ...overrides,
    };

    // Sanitize before returning to ensure no undefined fields are ever present.
    return sanitizeAttemptData(attemptObject) as QuizAttempt;
};
