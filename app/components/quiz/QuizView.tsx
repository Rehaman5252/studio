
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Lightbulb, Volume2, VolumeX, Loader2, ShieldAlert } from 'lucide-react';
import type { QuizQuestion, HintOutput } from '@/ai/schemas';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const QUESTION_TIME_LIMIT = 20; // seconds

interface QuizViewProps {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
    onAnswer: (answer: string) => void;
    onNoBall: (reason: 'no-ball') => void;
    brand: string;
    format: string;
    onHintRequest: () => void;
    hint: HintOutput | null;
    isHintLoading: boolean;
    soundEnabled: boolean;
    quizSource: 'ai' | 'fallback';
}

export default function QuizView({
    question,
    questionNumber,
    totalQuestions,
    onAnswer,
    onNoBall,
    brand,
    format,
    onHintRequest,
    hint,
    isHintLoading,
    soundEnabled,
    quizSource,
}: QuizViewProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
    
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({
        tick: null
    });
    
    const malpracticeRef = useRef({
      hiddenTimer: null as NodeJS.Timeout | null,
      tabSwitchCount: 0,
    });


    // Auto-advance logic
    const handleSelectOption = (option: string) => {
        if (isAnswered) return; // Prevent changing answer
        
        setIsAnswered(true);
        setSelectedOption(option);
        
        // Wait a moment to show selection, then advance
        setTimeout(() => {
            onAnswer(option);
        }, 800);
    };

     useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                onNoBall('no-ball');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [onNoBall]);
    
    useEffect(() => {
        // Reset state for the new question
        setTimeLeft(QUESTION_TIME_LIMIT);
        setSelectedOption(null);
        setIsAnswered(false);
        malpracticeRef.current.tabSwitchCount = 0; // Reset counter for new question
        
        if (malpracticeRef.current.hiddenTimer) {
            clearTimeout(malpracticeRef.current.hiddenTimer);
            malpracticeRef.current.hiddenTimer = null;
        }
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Time's up, advance with no answer
                    setTimeout(() => onAnswer(""), 100);
                    return 0;
                }
                if(prev <= 6 && soundEnabled) {
                    audioRefs.current.tick?.play().catch(e => console.log("Audio play failed", e));
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [question, onAnswer, soundEnabled]);
    
    const progressValue = (questionNumber / totalQuestions) * 100;

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-background to-secondary/50 text-foreground p-4 overflow-hidden">
            {typeof window !== 'undefined' && (
                <>
                    <audio ref={el => audioRefs.current.tick = el} src="/sounds/tick.mp3" preload="auto" />
                </>
            )}

            {/* Header */}
            <header className="flex flex-col gap-4 mb-4 shrink-0">
                 <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-primary animate-pulse">{brand} - {format}</p>
                        {quizSource === 'fallback' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs cursor-default">Standard</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>This is a standard quiz, provided when the AI was unavailable.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </motion.div>
                        )}
                    </div>
                    <div className="relative h-16 w-16">
                         <CircularProgressbar
                            value={timeLeft}
                            maxValue={QUESTION_TIME_LIMIT}
                            text={`${timeLeft}`}
                            styles={buildStyles({
                                textColor: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                                pathColor: timeLeft <= 5 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                                trailColor: 'hsl(var(--muted))',
                                textSize: '28px',
                            })}
                         />
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</h1>
                        <span className="text-sm font-semibold text-muted-foreground">{questionNumber}/{totalQuestions}</span>
                    </div>
                    <Progress value={progressValue} className="h-2 w-full" />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="w-full max-w-2xl space-y-6"
                    >
                        <Card className="shadow-lg bg-transparent border-0 text-center">
                            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">{question.question}</h2>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.options.map((option) => {
                                const isSelected = selectedOption === option;

                                return (
                                <motion.div 
                                    key={option}
                                    whileHover={{ scale: isAnswered ? 1 : 1.03 }}
                                    whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                                >
                                    <button
                                        onClick={() => handleSelectOption(option)}
                                        disabled={isAnswered}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 text-lg font-semibold",
                                            "bg-card shadow-md disabled:cursor-not-allowed",
                                            isAnswered ? "opacity-50" : "hover:border-primary/50 hover:shadow-primary/20",
                                            isSelected && 'border-primary shadow-lg shadow-primary/30 opacity-100'
                                        )}
                                    >
                                        {option}
                                    </button>
                                </motion.div>
                            )})}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="shrink-0 mt-auto pt-4 pb-12 text-center space-y-2">
                 {isHintLoading ? (
                    <div className="flex items-center justify-center gap-2 text-primary">
                        <Loader2 className="animate-spin" /> Fetching hint...
                    </div>
                 ) : hint ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-accent/20 rounded-lg text-sm text-center flex items-center justify-center gap-2"
                    >
                        {hint.source === 'fallback' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This is a generic hint as the AI could not generate one.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                       <span className="font-bold">Hint:</span> {hint.hint}
                    </motion.div>
                ) : (
                    <Button variant="outline" size="lg" onClick={onHintRequest} disabled={isAnswered}>
                        <Lightbulb className="text-primary mr-2" />
                        <span>Get a Hint</span>
                    </Button>
                )}
            </footer>
        </div>
    );
}
