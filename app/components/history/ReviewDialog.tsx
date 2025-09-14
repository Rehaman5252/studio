
'use client';

import { useState, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Award, ShieldQuestion } from 'lucide-react';
import type { QuizAttempt, QuizQuestion } from '@/ai/schemas';
import ReportQuestionDialog from '@/components/quiz/ReportQuestionDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attempt: QuizAttempt;
}

const ReviewDialogComponent = ({ open, onOpenChange, attempt }: ReviewDialogProps) => {
    const [reportingQuestion, setReportingQuestion] = useState<QuizQuestion | null>(null);

    if (!attempt) return null;

    const handleReportClick = (question: QuizQuestion) => {
        setReportingQuestion(question);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold">Answer Review</DialogTitle>
                        <DialogDescription className="text-center">
                            For the {attempt.format} quiz on {new Date(attempt.timestamp).toLocaleDateString()}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-2 py-4">
                        <Accordion type="single" collapsible className="w-full">
                            {attempt.questions.map((question, index) => {
                                const userAnswer = attempt.userAnswers[index];
                                const isCorrect = userAnswer === question.correctAnswer;
                                return (
                                    <AccordionItem value={`item-${index}`} key={question.id}>
                                        <AccordionTrigger className={cn("hover:no-underline p-3 rounded-lg text-left", isCorrect ? 'hover:bg-primary/10' : 'hover:bg-destructive/10')}>
                                            <div className="flex items-center gap-4 w-full">
                                                {isCorrect ? (
                                                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                                                ) : (
                                                    <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                                                )}
                                                <p className="flex-1 font-semibold text-foreground">{index + 1}. {question.question}</p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 bg-card/50 border-t">
                                            <div className="space-y-4">
                                                <div className="text-sm space-y-2">
                                                    <p className={cn("flex items-start gap-2 p-2 rounded-md", isCorrect ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive')}>
                                                        {isCorrect ? (
                                                            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <span>Your Answer: <span className="font-bold">{userAnswer || "Not Answered"}</span></span>
                                                    </p>
                                                    {!isCorrect && (
                                                        <p className="flex items-start gap-2 p-2 rounded-md bg-primary/10 text-primary">
                                                            <Award className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                            <span>Correct Answer: <span className="font-bold">{question.correctAnswer}</span></span>
                                                        </p>
                                                    )}
                                                </div>
                                                <Card className="bg-background/70 p-3 shadow-inner">
                                                    <p className="text-xs text-muted-foreground font-semibold mb-1">EXPLANATION</p>
                                                    <p className="text-sm">{question.explanation}</p>
                                                </Card>
                                                <div className="pt-2 flex justify-center">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-xs text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleReportClick(question)}
                                                    >
                                                        <ShieldQuestion className="mr-2 h-4 w-4" /> Report this question
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>

            {/* This ensures only one Report dialog is rendered at a time */}
            {reportingQuestion && (
                <ReportQuestionDialog
                    question={reportingQuestion}
                    open={!!reportingQuestion}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setReportingQuestion(null);
                        }
                    }}
                />
            )}
        </>
    );
}

export default memo(ReviewDialogComponent);
