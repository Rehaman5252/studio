
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Sparkles } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import { CricketLoading } from '@/components/CricketLoading';
import { generateQuizAnalysis, QuizAnalysisOutput } from '@/ai/flows/generate-quiz-analysis';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PageWrapper from '@/components/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, BarChart, Target, Zap, Lightbulb } from 'lucide-react';


const AnalysisSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <Card>
            <CardHeader><div className="h-6 w-3/4 bg-muted rounded-md"></div></CardHeader>
            <CardContent><div className="h-4 w-1/2 bg-muted rounded-md"></div></CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-4">
            <Card>
                <CardHeader><div className="h-5 w-24 bg-muted rounded-md"></div></CardHeader>
                <CardContent className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded-md"></div>
                    <div className="h-4 w-5/6 bg-muted rounded-md"></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><div className="h-5 w-32 bg-muted rounded-md"></div></CardHeader>
                <CardContent className="space-y-2">
                    <div className="h-4 w-full bg-muted rounded-md"></div>
                    <div className="h-4 w-5/6 bg-muted rounded-md"></div>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader><div className="h-5 w-28 bg-muted rounded-md"></div></CardHeader>
            <CardContent className="space-y-2">
                <div className="h-4 w-full bg-muted rounded-md"></div>
                <div className="h-4 w-5/6 bg-muted rounded-md"></div>
            </CardContent>
        </Card>
    </div>
)

const AnalysisContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [analysis, setAnalysis] = useState<QuizAnalysisOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const attempt: QuizAttempt | null = useMemo(() => {
        const attemptData = searchParams.get('attempt');
        if (!attemptData) return null;
        try {
            return JSON.parse(atob(attemptData));
        } catch (e) {
            console.error("Failed to parse attempt data for analysis:", e);
            return null;
        }
    }, [searchParams]);

    useEffect(() => {
        if (!attempt) {
            setError("No quiz data found for analysis.");
            setLoading(false);
            return;
        }

        const getAnalysis = async () => {
            try {
                setLoading(true);
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
    }, [attempt]);

    if (!attempt) {
        return (
            <PageWrapper title="Analysis Error" showBackButton>
                 <div className="text-center p-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>Could not load quiz data for analysis.</AlertDescription>
                    </Alert>
                    <Button onClick={() => router.push('/history')} className="mt-4">Back to History</Button>
                </div>
            </PageWrapper>
        );
    }
    
    const timeTaken = attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;

    return (
        <PageWrapper title="AI Performance Analysis" showBackButton>
             <header className="text-center space-y-2 mb-6">
                <h1 className="text-3xl font-bold">Your Quiz Debrief</h1>
                <p className="text-muted-foreground">An AI-powered look into your {attempt.format} quiz performance.</p>
                 <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <div><strong>Score:</strong> {attempt.score}/{attempt.totalQuestions}</div>
                    <div><strong>Time:</strong> {timeTaken.toFixed(1)}s</div>
                </div>
            </header>

            {loading ? <AnalysisSkeleton /> : error ? (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Analysis Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : analysis && (
                <div className="space-y-4 animate-fade-in-up">
                    <Card className="bg-card/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart /> Overall Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{analysis.overallPerformance}</p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary"><Zap /> Key Strengths</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.keyStrengths.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-destructive"><Target /> Areas for Improvement</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 space-y-1">
                                    {analysis.areasForImprovement.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-accent"><Lightbulb /> Smart Tips for Next Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ul className="list-disc pl-5 space-y-1">
                                {analysis.smartTips.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                <Button size="lg" onClick={() => router.push('/history')}>
                     Back to History
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/home')}>
                    <Home className="mr-2" /> Play Again
                </Button>
            </div>
        </PageWrapper>
    );
};

export default function QuizAnalysisPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>}>
            <AnalysisContent />
        </Suspense>
    )
}
