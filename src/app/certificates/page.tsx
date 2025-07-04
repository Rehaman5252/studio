
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Loader2 } from 'lucide-react';
import useRequireAuth from '@/hooks/useRequireAuth';

// Mock data for certificates earned by the user
const certificates = [
  { id: 1, title: 'T20 Masterclass Certificate', date: '2024-07-21', brand: 'Apple' },
  { id: 2, title: 'Test Cricket Expert Certificate', date: '2024-07-19', brand: 'SBI' },
  { id: 3, title: 'IPL 2024 Champion Certificate', date: '2024-07-18', brand: 'boAt' },
  { id: 4, title: 'ODI Whiz Certificate', date: '2024-07-15', brand: 'Nike' },
];

export default function CertificatesPage() {
  const { loading } = useRequireAuth();
  
  if (loading) {
      return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-primary/80 via-green-800 to-green-900/80 items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary/80 via-green-800 to-green-900/80">
      <header className="p-4 bg-background/70 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <Card key={cert.id} className="bg-background/70 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-yellow-400" />
                    <div>
                        <CardTitle className="text-lg">{cert.title}</CardTitle>
                        <CardDescription>Awarded on {cert.date} for the {cert.brand} quiz</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="secondary" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-background/70 backdrop-blur-sm border-white/20">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p className="font-semibold">No certificates yet!</p>
              <p>Score a perfect 5/5 in any quiz to earn your first certificate.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
