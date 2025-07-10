
'use client';

import { memo } from 'react';
import { Star } from 'lucide-react';

const CertificateComponent = ({ format, userName, date, slotTimings }: { format: string; userName: string; date: string; slotTimings: string }) => (
    <div className="w-full max-w-md">
        <div className="bg-card text-foreground rounded-lg p-6 border-4 border-primary shadow-2xl shadow-primary/20 relative mt-4">
            <Star className="absolute top-2 right-2 text-primary" size={32} />
            <Star className="absolute top-2 left-2 text-primary" size={32} />
            <Star className="absolute bottom-2 right-2 text-primary" size={32} />
            <Star className="absolute bottom-2 left-2 text-primary" size={32} />
            <div className="text-center">
                <p className="text-lg font-semibold text-muted-foreground">Certificate of Achievement</p>
                <p className="text-sm">This certifies that</p>
                <p className="text-2xl font-bold my-2 text-primary">{userName}</p>
                <p className="text-sm">has successfully achieved a perfect score in the</p>
                <p className="text-xl font-bold my-2">{format} Quiz</p>
                <p className="text-xs mt-4 text-muted-foreground">Awarded on: {date}</p>
                <p className="text-xs mt-1 text-muted-foreground">Quiz Slot: {slotTimings}</p>
            </div>
        </div>
    </div>
);

CertificateComponent.displayName = 'Certificate';
export const Certificate = memo(CertificateComponent);
