'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Calendar, Clock, MessageSquareQuote, Sparkles, AlertTriangle, Send } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthProvider';
import { cn } from '@/lib/utils';
import { sendQuizHistoryEmail } from '@/ai/flows/send-quiz-history-email';
import { useToast } from '@/hooks/use-toast';

const AnalysisDialog = ({ attempt }: { attempt: QuizAttempt }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAnalysisCacheKey = useCallback(() => `analysis_${attempt.format}_${attempt.slotId}`, [attempt.slotId, attempt.format]);

    const handleFetchAnalysis = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const cachedAnalysis = localStorage.getItem(getAnalysisCacheKey());
        if (cachedAnalysis) {
            setAnalysis(cachedAnalysis);
            return;
        }

        if (isLoading || !attempt.questions || !attempt.userAnswers) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await generateQuizAnalysis({
                questions: attempt.questions,
                userAnswers: attempt.userAnswers,
                format: attempt.format,
                timePerQuestion: attempt.timePerQuestion,
                usedHintIndices: attempt.usedHintIndices,
            });
            if (!result.analysis) throw new Error("Received empty analysis from the server.");
            setAnalysis(result.analysis);
            localStorage.setItem(getAnalysisCacheKey(), result.analysis);
        } catch (err: any) {
            setError(err.message?.includes('offline') ? "You are offline. Please reconnect to generate AI analysis." : 'Could not generate the analysis. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, attempt, getAnalysisCacheKey]);

    const handleOpenChange = useCallback((open: boolean) => {
        if (open && !analysis) handleFetchAnalysis();
    }, [analysis, handleFetchAnalysis]);

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" disabled={!!attempt.reason}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    View Analysis
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-card/90 backdrop-blur-sm">
                <DialogHeader>
                    <DialogTitle>Quiz Performance Analysis</DialogTitle>
                    <DialogDescription>
                        AI-powered feedback on your {attempt.format} quiz from {new Date(attempt.timestamp).toLocaleDateString()}.
                    </DialogDescription>
                </DialogHeader>
                <div className="text-sm max-h-[60vh] overflow-y-auto pr-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-8 space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4 text-muted-foreground">Generating your personalized report...</p>
                        </div>
                    )}
                    {error && <p className="text-destructive font-semibold p-4 text-center">{error}</p>}
                    {analysis && (
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:text-md [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mt-2">
                           <ReactMarkdown>{analysis}</ReactMarkdown>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const getSlotTimings = (timestamp: number) => {
    const d = new Date(timestamp);
    const start = new Date(d);
    start.setMinutes(Math.floor(d.getMinutes() / 10) * 10, 0, 0);
    const end = new Date(start.getTime() + 10 * 60 * 1000);
    const format = (dt: Date) => dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${format(start)} - ${format(end)}`;
};

const QuizHistoryItem = memo(({ attempt }: { attempt: QuizAttempt }) => {
    const isMalpractice = attempt.reason === 'malpractice';
    return (
        <Card className={cn("bg-card/80 border-primary/10 shadow-lg", isMalpractice && "bg-destructive/10 border-destructive/20")}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg">
                    <span>{attempt.format} Quiz</span>
                    <span className={cn("text-lg font-bold text-primary", isMalpractice && "text-destructive")}>
                        {isMalpractice ? 'Disqualified' : `${attempt.score}/${attempt.totalQuestions}`}
                    </span>
                </CardTitle>
                <CardDescription className="text-xs">Sponsored by {attempt.brand}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{new Date(attempt.timestamp).toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span className="text-xs">{getSlotTimings(attempt.timestamp)}</span></div>
                    {isMalpractice && <div className="flex items-center gap-2 text-destructive pt-1"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-semibold">Malpractice Detected</span></div>}
                </div>
                <AnalysisDialog attempt={attempt} />
            </CardContent>
        </Card>
    );
});
QuizHistoryItem.displayName = "QuizHistoryItem";


export default function QuizHistoryContent({ initialHistory }: { initialHistory: QuizAttempt[] }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [filter, setFilter] = useState<'recent' | 'all' | 'perfect'>('recent');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const handleSendHistory = async () => {
        if (!user?.email) {
            toast({ title: "Error", description: "Your email is not available.", variant: "destructive" });
            return;
        }
        setIsSendingEmail(true);
        try {
            const result = await sendQuizHistoryEmail({ email: user.email, history: initialHistory });
            if (result.success) {
                toast({ title: "Email Sent!", description: result.message });
            } else {
                throw new Error(result.message);
            }
        } catch (e: any) {
            toast({ title: "Error", description: "Could not send history email. Please try again.", variant: "destructive" });
        } finally {
            setIsSendingEmail(false);
        }
    };

    const filteredHistory = useMemo(() => {
        switch(filter) {
            case 'perfect':
                return initialHistory.filter(a => a.score === a.totalQuestions && !a.reason);
            case 'recent':
                return initialHistory.slice(0, 5);
            case 'all':
            default:
                return initialHistory.slice(0, 20);
        }
    }, [initialHistory, filter]);

    const renderContent = () => {
        if (!initialHistory.length) return (
            <div>
                <Card className="bg-card/80 mt-4"><CardContent className="p-6 text-center text-muted-foreground"><MessageSquareQuote className="h-12 w-12 mx-auto text-primary/50 mb-4" /><p className="font-semibold text-lg">No Quizzes Found</p><p>Your played quizzes will appear here!</p></CardContent></Card>
            </div>
        );
        return (
            <div className="space-y-4 pt-4">
                {filter === 'all' && initialHistory.length > 20 && (
                     <Card className="bg-card/80">
                        <CardContent className="p-4 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Showing the last 20 quizzes.</p>
                            <Button size="sm" onClick={handleSendHistory} disabled={isSendingEmail}>
                                {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Email Full History
                            </Button>
                        </CardContent>
                    </Card>
                )}
                {filteredHistory.map((attempt) => (
                    <QuizHistoryItem key={`${attempt.slotId}-${attempt.format}-${attempt.timestamp}`} attempt={attempt} />
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="flex justify-center">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full max-w-md">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="recent">Recent</TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="perfect">Perfect</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            {renderContent()}
        </>
    );
}
