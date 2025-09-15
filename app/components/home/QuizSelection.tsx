
'use client';

import React, { useState, useCallback, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { brandData, type CubeBrand } from '@/components/home/brandData';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const BrandCube = dynamic(() => import('@/components/home/BrandCube'), { 
    loading: () => <Skeleton className="w-48 h-48 rounded-lg" />,
    ssr: false 
});
const GlobalStats = dynamic(() => import('@/components/home/GlobalStats'), {
    loading: () => <Skeleton className="h-[200px] w-full" />,
});
const SelectedBrandCard = dynamic(() => import('@/components/home/SelectedBrandCard'), {
    loading: () => <Skeleton className="h-[124px] w-full" />,
});

const faceRotations = [
    { x: 0, y: 0 },    // Front (Mixed)
    { x: 0, y: -90 },  // Right (IPL)
    { x: 0, y: -180 }, // Back (T20)
    { x: 0, y: 90 },   // Left (ODI)
    { x: -90, y: 0 },  // Top (WPL)
    { x: 90, y: 0 }    // Bottom (Test)
];

const ROTATION_INTERVAL_MS = 750;

interface QuizSelectionProps {
    selectedBrand: CubeBrand;
    setSelectedBrand: React.Dispatch<React.SetStateAction<CubeBrand>>;
    handleStartQuiz: (brand: CubeBrand) => void;
}

const QuizSelectionComponent = ({ selectedBrand, setSelectedBrand, handleStartQuiz }: QuizSelectionProps) => {
    const { isProfileComplete, user } = useAuth();
    const router = useRouter();
    
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [showProfileAlert, setShowProfileAlert] = useState(false);
    const [rotation, setRotation] = useState(faceRotations[0]);
    const [isRotating, setIsRotating] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            // Pre-fetch quiz data in the background to make quiz start faster
            fetch('/api/quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: 'mixed', userId: user.uid }),
            }).catch(e => console.warn("Quiz prefetching failed in background:", e));
        }
    }, [user]);
    
    useEffect(() => {
        if (!isRotating) return;

        const rotationInterval = setInterval(() => {
            setCurrentFaceIndex(prevIndex => {
                const newIndex = (prevIndex + 1) % faceRotations.length;
                setRotation(faceRotations[newIndex]);
                setSelectedBrand(brandData[newIndex]);
                return newIndex;
            });
        }, ROTATION_INTERVAL_MS);

        return () => clearInterval(rotationInterval);
    }, [isRotating, setSelectedBrand]);
    
    const initiateQuiz = useCallback((brand: CubeBrand) => {
        setIsRotating(false);
        if (!isProfileComplete) {
            setShowProfileAlert(true);
        } else {
             handleStartQuiz(brand);
        }
    }, [isProfileComplete, handleStartQuiz]);
    
    const handleFaceClick = (brand: CubeBrand) => {
        const clickedIndex = brandData.findIndex(b => b.id === brand.id);
        if (clickedIndex !== -1) {
            setCurrentFaceIndex(clickedIndex);
            setRotation(faceRotations[clickedIndex]);
            setSelectedBrand(brand);
        }
        initiateQuiz(brand);
    };
  
    const handleAuthAlertAction = () => {
        router.push('/profile');
        setShowProfileAlert(false);
    }
    
    return (
        <>
            <div className="text-center" id="tour-step-1">
                <h2 className="text-2xl font-bold">Select Your Quiz Format</h2>
                <p className="text-sm text-muted-foreground">Click a face to play instantly</p>
            </div>
            
            <div className="flex justify-center items-center mt-0 h-[200px] w-full">
                <BrandCube onFaceClick={handleFaceClick} rotation={rotation} />
            </div>

            <SelectedBrandCard 
                selectedBrand={selectedBrand} 
                onClick={() => {
                    initiateQuiz(selectedBrand)}
                } 
            />

            <div className="mt-6 space-y-8" id="tour-step-2">
                <GlobalStats />
            </div>
            
            <AlertDialog open={showProfileAlert} onOpenChange={setShowProfileAlert}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Profile Incomplete</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please complete your profile to start playing quizzes and earning rewards.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                    <AlertDialogAction type="button" onClick={handleAuthAlertAction}>
                        Complete Profile
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default memo(QuizSelectionComponent);
