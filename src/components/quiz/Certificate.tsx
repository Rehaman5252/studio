
'use client';

import { memo } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { useAuth } from '@/context/AuthProvider';
import { Download, Share2 } from 'lucide-react';

const CertificateComponent = ({ format, userName, date, slotTimings }: { format: string; userName: string; date: string; slotTimings: string }) => {
    const { profile } = useAuth();
    const { toast } = useToast();

    const handleDownload = () => {
        const doc = new jsPDF();

        doc.setDrawColor(218, 165, 32); // Gold
        doc.setLineWidth(1.5);
        doc.rect(5, 5, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10);

        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(218, 165, 32); // Gold
        doc.text('Certificate of Achievement', doc.internal.pageSize.width / 2, 30, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('This certifies that', doc.internal.pageSize.width / 2, 50, { align: 'center' });
        
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 85, 255);
        doc.text(profile?.name || 'Valued Player', doc.internal.pageSize.width / 2, 70, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('has successfully achieved a perfect score in the', doc.internal.pageSize.width / 2, 90, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${format} Quiz`, doc.internal.pageSize.width / 2, 105, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`Awarded on: ${date}`, 30, 130);
        doc.text(`Quiz Slot: ${slotTimings}`, 30, 137);

        doc.setLineWidth(0.5);
        doc.line(130, 135, 180, 135);
        doc.setFontSize(10);
        doc.text('Authorized Signature', 135, 140);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(218, 165, 32);
        doc.text('indcric', doc.internal.pageSize.width / 2, 160, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('The Ultimate Cricket Quiz', doc.internal.pageSize.width / 2, 165, { align: 'center' });
        
        doc.save(`indcric_${format}_Certificate.pdf`);
        
        toast({
            title: "Download Started",
            description: "Your certificate is being downloaded as a PDF.",
        });
    };

    const handleShare = async () => {
        const shareData = {
            title: `I earned an indcric Certificate!`,
            text: `I just got a perfect score in the ${format} quiz on indcric! Think you can beat me?`,
            url: window.location.href,
        };
        try {
            await navigator.share(shareData);
        } catch (error) {
            console.error('Share failed:', error);
            navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
            toast({ title: 'Copied to clipboard', description: 'Sharing is not available, so we copied the text for you!' });
        }
    };

    return (
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
                <div className="flex justify-center gap-2 mt-4">
                    <Button variant="secondary" size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                </div>
            </div>
        </div>
    );
};

CertificateComponent.displayName = 'Certificate';
export const Certificate = memo(CertificateComponent);
