
'use client';

import type { QuizAttempt, QuizData } from '@/ai/schemas';
import type { User } from 'firebase/auth';
import { getQuizSlotId } from '@/lib/utils';
import { sanitizeUserProfile } from './sanitizeUserProfile';

/**
 * Encodes a QuizAttempt object into a Base64 string for URL transport.
 */
export const encodeAttempt = (attempt: QuizAttempt): string => {
    try {
        return encodeURIComponent(btoa(JSON.stringify(sanitizeUserProfile(attempt))));
    } catch (e) {
        console.error("Failed to encode attempt:", e);
        return "";
    }
}

/**
 * Decodes a Base64 string from a URL into a QuizAttempt object.
 */
export const decodeAttempt = (encodedAttempt: string): QuizAttempt | null => {
    try {
        return JSON.parse(atob(decodeURIComponent(encodedAttempt)));
    } catch (e) {
        console.error("Failed to decode attempt:", e);
        return null;
    }
}


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
        source: quizData.source,
        unanswered: unansweredCount,
        ...overrides,
    };

    return sanitizeUserProfile(attemptObject) as QuizAttempt;
};
