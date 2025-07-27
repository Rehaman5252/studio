
'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import type { QuizQuestion } from '@/ai/schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';
import ReactMarkdown from 'react-markdown';


const AnalysisCardComponent = ({ questions, userAnswers, timePerQuestion, usedHintIndices, slotId, format }: { questions: QuizQuestion[]; userAnswers: string[], timePerQuestion?: number[], usedHintIndices?: number[], slotId: string, format: string }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAnalysisCacheKey = useCallback(() => `analysis_${format}_${slotId}`, [slotId, format]);

    useEffect(() => {
        const cachedAnalysis = localStorage.getItem(getAnalysisCacheKey());
        if (cachedAnalysis) {
            setAnalysis(cachedAnalysis);
        }
    }, [getAnalysisCacheKey]);

    const handleFetchAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateQuizAnalysis({ questions, userAnswers, format, timePerQuestion, usedHintIndices });
            setAnalysis(result.analysis);
            localStorage.setItem(getAnalysisCacheKey(), result.analysis);
        } catch (err) {
            console.error("Analysis generation failed:", err);
            setError('Could not generate the analysis. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [questions, userAnswers, timePerQuestion, usedHintIndices, getAnalysisCacheKey, format]);
    
    return (
        <div className="w-full max-w-md">
            <Card className="w-full text-left bg-card border-0 mt-4 mb-4">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary" /> AI Performance Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                {analysis ? (
                     <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:text-md [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mt-2">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="text-center">
                        <h3 className="text-lg font-bold">Want to improve?</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get a personalized analysis of your performance from our AI coach.</p>
                        {isLoading ? (
                            <Button disabled className="w-full">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Report...
                            </Button>
                        ) : (
                            <Button onClick={handleFetchAnalysis} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                Generate Free Analysis
                            </Button>
                        )}
                        {error && <p className="text-destructive text-xs mt-2">{error}</p>}
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    )
};

AnalysisCardComponent.displayName = 'AnalysisCard';
export const AnalysisCard = memo(AnalysisCardComponent);
