
'use client';

import { memo } from 'react';
import type { QuizQuestion } from '@/ai/schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

const AnswerReview = ({ questions, userAnswers }: { questions: QuizQuestion[], userAnswers: string[] }) => (
    <div className="w-full max-w-md">
        <Card className="w-full text-left bg-card border-0 mt-4 mb-4">
            <CardHeader><CardTitle>Answer Review</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {questions.map((q, i) => (
                    <div key={`${q.questionText}-${i}`} className="text-sm p-3 rounded-lg bg-background">
                        <p className="font-bold mb-2 flex items-start gap-2"><MessageCircleQuestion className="h-5 w-5 mt-0.5 shrink-0"/> {i+1}. {q.questionText}</p>
                        <p className={cn("flex items-center text-foreground/90", userAnswers[i] === q.correctAnswer ? 'text-green-400' : 'text-red-400' )}>
                          {userAnswers[i] === q.correctAnswer ? <CheckCircle2 className="mr-2 shrink-0"/> : <XCircle className="mr-2 shrink-0"/>}
                          Your answer: {userAnswers[i] || 'Not answered'}
                        </p>
                        {userAnswers[i] !== q.correctAnswer && <p className="text-green-400 flex items-center"><CheckCircle2 className="mr-2 shrink-0"/> Correct: {q.correctAnswer}</p>}
                        {q.explanation && (
                            <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                                <p className="font-semibold text-foreground">Explanation:</p>
                                <p>{q.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
);

AnswerReview.displayName = 'AnswerReview';
export { AnswerReview };
