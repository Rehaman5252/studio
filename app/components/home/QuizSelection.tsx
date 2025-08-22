
'use client';

import React, 'use client';

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
import GlobalStats from '@/components/home/GlobalStats';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import { brandData, type CubeBrand } from '@/components/home/brandData';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const BrandCube = dynamic(() => import('@/components/home/BrandCube'), { 
    loading: () => <Skeleton className="w-48 h-48 rounded-lg" />,
    ssr: false 
});

const faceRotations = [
    { x: 0, y: 0 },    // Front (Mixed)
    { x: 0, y: -90 },  // Right (IPL)
    { x: 0, y: -180 }, // Back (T20)
    { x: 0, y: 90 },   // Left (ODI)
    { x: -90, y: 0 },  // Top (WPL)
    { x: 90, y: 0 }    // Bottom (Test)
];

interface QuizSelectionProps {
    selectedBrand: CubeBrand;
    setSelectedBrand: React.Dispatch<React.SetStateAction<CubeBrand>>;
    handleStartQuiz: () => void;
}

const QuizSelectionComponent = ({ selectedBrand, setSelectedBrand, handleStartQuiz }: QuizSelectionProps) => {
    const { isProfileComplete } = useAuth();
    const router = useRouter();
    
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [showProfileAlert, setShowProfileAlert] = useState(false);
    const [rotation, setRotation] = useState(faceRotations[0]);
    const [isRotating, setIsRotating] = useState(true);

    useEffect(() => {
        // Prefetch immediately on component mount
        fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format: 'Mixed', userId: 'prefetch-user' }),
        }).catch(e => console.warn("Quiz prefetching failed in background:", e));
    }, []);
    
    useEffect(() => {
        if (!isRotating) return;

        const rotationInterval = setInterval(() => {
            setCurrentFaceIndex(prevIndex => {
                const newIndex = (prevIndex + 1) % faceRotations.length;
                setRotation(faceRotations[newIndex]);
                setSelectedBrand(brandData[newIndex]);
                return newIndex;
            });
        }, 750); // Rotate every 0.75 seconds to complete the cycle in 4.5s

        return () => clearInterval(rotationInterval);
    }, [isRotating, setSelectedBrand]);
    
    const initiateQuiz = useCallback(() => {
        if (!isProfileComplete) {
            setShowProfileAlert(true);
        } else {
            handleStartQuiz();
        }
    }, [isProfileComplete, handleStartQuiz]);
    
    const handleFaceClick = (brand: CubeBrand) => {
        setIsRotating(false); // Stop auto-rotation on user interaction
        const clickedIndex = brandData.findIndex(b => b.id === brand.id);
        if (clickedIndex !== -1) {
            setCurrentFaceIndex(clickedIndex);
            setRotation(faceRotations[clickedIndex]);
            setSelectedBrand(brandData[clickedIndex]);
            // Use a short delay to allow the cube to rotate before initiating the quiz start logic
            setTimeout(() => {
               initiateQuiz();
            }, 300);
        }
    };
  
    const handleAuthAlertAction = () => {
        router.push('/profile');
        setShowProfileAlert(false);
    }
    
    return (
        <>
            <div className="text-center" id="tour-step-1">
                <h2 className="text-2xl font-bold">Select Your Quiz Format</h2>
                <p className="text-sm text-foreground/60">Click a face to select or wait for rotation</p>
            </div>
            
            <div className="flex justify-center items-center mt-0 mb-4 h-[250px] w-full">
                <BrandCube onFaceClick={handleFaceClick} rotation={rotation} />
            </div>

            <SelectedBrandCard 
                selectedBrand={selectedBrand} 
                onClick={initiateQuiz} 
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
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAuthAlertAction}>
                        Complete Profile
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default memo(QuizSelectionComponent);
