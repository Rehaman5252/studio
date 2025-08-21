
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import ReportQuestionDialog from '@/components/quiz/ReportQuestionDialog';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attempt: QuizAttempt;
}

export default function ReviewDialog({ open, onOpenChange, attempt }: ReviewDialogProps) {
    if (!attempt) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">Answer Review</DialogTitle>
                    <DialogDescription className="text-center">
                        For the {attempt.format} quiz on {new Date(attempt.timestamp).toLocaleDateString()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4 py-4">
                    {attempt.questions.map((question, index) => (
                        <Card key={question.id} className="bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">{index + 1}. {question.question}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm space-y-2">
                                    <p className="flex items-start gap-2">
                                        {attempt.userAnswers[index] === question.correctAnswer ?
                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" /> :
                                            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                        }
                                        <span>Your Answer: <span className="font-semibold">{attempt.userAnswers[index] || "Not Answered"}</span></span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <Award className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Correct Answer: <span className="font-semibold">{question.correctAnswer}</span></span>
                                    </p>
                                </div>
                                <Card className="bg-background/70 p-3">
                                    <p className="text-xs text-muted-foreground font-semibold">EXPLANATION</p>
                                    <p className="text-sm">{question.explanation}</p>
                                </Card>
                                <div className="pt-2 flex justify-center">
                                    <ReportQuestionDialog questionId={question.id} questionText={question.question} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="flex justify-end pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}

