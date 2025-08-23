
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Volume2, VolumeX, Loader2, AlertTriangle } from 'lucide-react';
import { QuizQuestion } from '@/ai/schemas';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';


const QUESTION_TIME_LIMIT = 15; // seconds

interface QuizViewProps {
    question: QuizQuestion;
    questionNumber: number;
    totalQuestions: number;
    onAnswer: (answer: string) => void;
    onNoBall: (reason: 'no-ball') => void;
    brand: string;
    format: string;
    onHintRequest: () => void;
    hint: string | null;
    isHintLoading: boolean;
    soundEnabled: boolean;
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
    soundEnabled
}: QuizViewProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
    const [isMuted, setIsMuted] = useState(!soundEnabled);
    const [showNoBallAlert, setShowNoBallAlert] = useState(false);
    
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({
        tick: null
    });

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                setShowNoBallAlert(true);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const handleNoBallConfirm = () => {
        setShowNoBallAlert(false);
        onNoBall('no-ball');
    };
    
    useEffect(() => {
        setTimeLeft(QUESTION_TIME_LIMIT);
        setSelectedOption(null);
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onAnswer(selectedOption || ""); 
                    return 0;
                }
                if(prev <= 6 && !isMuted) {
                    audioRefs.current.tick?.play().catch(e => console.log("Audio play failed", e));
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [question, onAnswer, isMuted, selectedOption]);


    const handleSubmit = () => {
        if (selectedOption !== null) {
            onAnswer(selectedOption);
        }
    };
    
    const progressValue = (questionNumber / totalQuestions) * 100;

    return (
        <div className="flex flex-col h-screen bg-background text-foreground p-4">
            {typeof window !== 'undefined' && (
                <>
                    <audio ref={el => audioRefs.current.tick = el} src="/sounds/tick.mp3" preload="auto" />
                </>
            )}

            <header className="flex flex-col gap-4 mb-4">
                 <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-primary">{brand} - {format}</p>
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
                        <h1 className="text-lg font-semibold">Question Progress</h1>
                        <span className="text-sm font-semibold text-muted-foreground">{questionNumber}/{totalQuestions}</span>
                    </div>
                    <Progress value={progressValue} className="h-3 w-full" />
                </div>
            </header>

            <main className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        <Card className="shadow-lg bg-transparent border-0">
                            <CardHeader className="p-0">
                                <CardTitle className="text-2xl md:text-3xl font-bold text-center">{question.question}</CardTitle>
                            </CardHeader>
                        </Card>

                        <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption} className="space-y-4">
                            {question.options.map((option, index) => (
                                <motion.div 
                                    key={option}
                                    whileHover={selectedOption !== option ? { scale: 1.03 } : {}}
                                    whileTap={selectedOption !== option ? { scale: 0.98 } : {}}
                                >
                                    <Label 
                                        htmlFor={`option-${index}`} 
                                        className={cn(
                                            "flex items-center p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2",
                                            "bg-card shadow-md",
                                            selectedOption === option 
                                                ? 'border-primary shadow-lg shadow-primary/30' 
                                                : 'border-transparent hover:border-primary/50'
                                        )}
                                    >
                                        <RadioGroupItem value={option} id={`option-${index}`} className="mr-4 h-5 w-5" />
                                        <span className="flex-1 text-base font-medium">{option}</span>
                                    </Label>
                                </motion.div>
                            ))}
                        </RadioGroup>
                    </motion.div>
                </AnimatePresence>

                 {hint && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-accent/20 rounded-lg text-sm text-center"
                    >
                       <span className="font-bold">Hint:</span> {hint}
                    </motion.div>
                )}

            </main>

            <footer className="mt-auto pt-4 pb-12">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="lg" onClick={onHintRequest} disabled={isHintLoading || !!hint}>
                        {isHintLoading ? <Loader2 className="animate-spin text-primary" /> : <Lightbulb className="text-primary" />}
                        <span className="ml-2">Get a Hint</span>
                    </Button>
                    <motion.div
                        animate={!selectedOption ? { opacity: [1, 0.7, 1] } : { opacity: 1 }}
                        transition={!selectedOption ? { duration: 1.5, repeat: Infinity } : {}}
                    >
                        <Button onClick={handleSubmit} disabled={!selectedOption} size="lg" className="w-full font-bold">
                            Submit Answer
                        </Button>
                    </motion.div>
                </div>
            </footer>
            
            <div className="fixed bottom-4 right-4 z-50">
                <Button 
                    variant="ghost" 
                    className="rounded-full h-12 w-12 bg-card/50 hover:bg-card/90 shadow-md" 
                    size="icon" 
                    onClick={() => setIsMuted(prev => !prev)}
                >
                    {isMuted ? <VolumeX className="text-primary"/> : <Volume2 className="text-primary"/>}
                </Button>
            </div>

            <AlertDialog open={showNoBallAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Fair Play Warning!</AlertDialogTitle>
                        <AlertDialogDescription>
                           You switched tabs or minimized the window, which is against the rules. This will be counted as a "No Ball".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleNoBallConfirm}>I Understand</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
