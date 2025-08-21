
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import type { QuizAttempt } from '@/ai/schemas';
import { CricketLoading } from '@/components/CricketLoading';
import { generateQuizAnalysis, QuizAnalysisOutput } from '@/ai/flows/generate-quiz-analysis';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BarChart, Target, Zap, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const AnalysisSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent className="space-y-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
        </div>
        <Card><CardHeader><Skeleton className="h-5 w-28" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /></CardContent></Card>
    </div>
)

const StatCard = ({ title, value, unit }: { title: string, value: string | number, unit?: string }) => (
    <Card className="text-center"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{value}{unit && <span className="text-lg font-normal">{unit}</span>}</p></CardContent></Card>
)

interface AnalysisDialogProps {
    attempt: QuizAttempt;
    children: ReactNode;
}

export default function AnalysisDialog({ attempt, children }: AnalysisDialogProps) {
    const [analysis, setAnalysis] = useState<QuizAnalysisOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const getAnalysis = async () => {
            setLoading(true);
            setError(null);
            setAnalysis(null);
            try {
                const result = await generateQuizAnalysis(attempt);
                setAnalysis(result);
            } catch (e) {
                console.error("Error generating quiz analysis:", e);
                setError("Could not generate AI analysis at this time. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        getAnalysis();
    }, [isOpen, attempt]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">AI Performance Analysis</DialogTitle>
                    <DialogDescription className="text-center">A detailed debrief of your {attempt.format} quiz performance.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6 py-4">
                    {loading ? <AnalysisSkeleton /> : error ? (
                        <Alert variant="destructive" className="my-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                    ) : analysis && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <StatCard title="Final Score" value={`${attempt.score}/${attempt.totalQuestions}`} />
                                <StatCard title="Accuracy" value={analysis.accuracy} unit="%" />
                                <StatCard title="Avg. Time" value={analysis.averageTimePerQuestion} unit="s" />
                            </div>

                            <Card className="bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart /> Performance Summary</CardTitle></CardHeader><CardContent><p>{analysis.overallPerformance}</p></CardContent></Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Zap /> Key Strengths</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{analysis.keyStrengths.map((item, i) => <li key={i}>{item}</li>)}</ul></CardContent></Card>
                                <Card><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Target /> Areas for Improvement</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-1 text-sm">{analysis.areasForImprovement.map((item, i) => <li key={i}>{item}</li>)}</ul></CardContent></Card>
                            </div>

                            <Card className="bg-accent/10 border-accent/50"><CardHeader><CardTitle className="flex items-center gap-2 text-accent"><Lightbulb /> Coach's Tip</CardTitle></CardHeader><CardContent><p className="text-sm">{analysis.coachTip}</p></CardContent></Card>

                            <Card>
                                <CardHeader><CardTitle>Question Breakdown</CardTitle><CardDescription>A detailed look at each question.</CardDescription></CardHeader>
                                <CardContent>
                                    <Table><TableHeader><TableRow><TableHead className="w-[10px]">Q#</TableHead><TableHead>Your Answer</TableHead><TableHead>Time</TableHead><TableHead>Category</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {analysis.analyzedQuestions.map((q, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">{i+1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {q.isCorrect ? <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" /> : <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
                                                            <div className="flex flex-col text-xs">
                                                                <span className={q.isCorrect ? '' : 'line-through text-muted-foreground'}>{q.userAnswer || "Skipped"}</span>
                                                                {!q.isCorrect && <span className="">Correct: {q.correctAnswer}</span>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{q.timeTaken.toFixed(1)}s</TableCell>
                                                    <TableCell><Badge variant="secondary">{q.category}</Badge></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

