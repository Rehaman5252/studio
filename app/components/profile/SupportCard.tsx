
'use client';

import React, { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone } from 'lucide-react';

const SupportCardComponent = () => {
    const supportEmail = 'support@indcric.app';
    const supportWhatsApp = '911234567890'; // Replace with a real number

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Third Umpire Review</CardTitle>
                <CardDescription>Need assistance? Go upstairs to the third umpire for help.</CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                             <MessageSquare className="mr-4 text-primary" />
                             Contact Us
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Contact Support</DialogTitle>
                            <DialogDescription>
                                Choose your preferred method to get in touch with our team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            <Button asChild size="lg" className="w-full justify-start text-base py-8">
                                <a href={`mailto:${supportEmail}`}>
                                    <Mail className="mr-4 text-primary" /> Email Us
                                </a>
                            </Button>
                            <Button asChild size="lg" className="w-full justify-start text-base py-8" variant="outline">
                                <a href={`https://wa.me/${supportWhatsApp}`} target="_blank" rel="noopener noreferrer">
                                    <Phone className="mr-4 text-primary" /> WhatsApp
                                </a>
                            </Button>
                        </div>
                         <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

const SupportCard = memo(SupportCardComponent);
export default SupportCard;
