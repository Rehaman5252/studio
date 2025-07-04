'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button }from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, BadgePercent, Banknote, Edit, FileDown, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="bg-background/80 backdrop-blur-sm text-center">
        <CardContent className="p-4">
            <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </CardContent>
    </Card>
)

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/80 to-green-300/80 pb-20">
      <header className="p-4 bg-background/50 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
        <Button variant="ghost" size="icon">
            <LogOut />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8">
        <section className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="avatar person" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">CricBlitz User</h2>
            <p className="text-muted-foreground">user@example.com</p>
        </section>

        <section className="grid grid-cols-3 gap-4">
            <StatCard title="Quizzes" value={23} icon={BarChart} />
            <StatCard title="Highest Streak" value={7} icon={BadgePercent} />
            <StatCard title="Earned" value="₹500" icon={Banknote} />
        </section>

        <section>
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Personal Details</span>
                        <Button variant="outline" size="sm"><Edit className="mr-2" /> Edit</Button>
                    </CardTitle>
                    <CardDescription>This information can only be edited once.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue="CricBlitz User" disabled />
                        </div>
                        <div>
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" type="number" defaultValue="25" disabled />
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select disabled defaultValue="male">
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="occupation">Occupation</Label>
                         <Select disabled defaultValue="student">
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="job">Job Holder</SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </section>

        <section>
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Bank & UPI Details</span>
                         <Button variant="outline" size="sm"><ShieldCheck className="mr-2" /> Save</Button>
                    </CardTitle>
                    <CardDescription>Your payment info. This cannot be changed after saving.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="upi">UPI ID</Label>
                        <Input id="upi" placeholder="your-upi@oksbi" />
                    </div>
                    <div className="text-center text-muted-foreground font-semibold">OR</div>
                     <div>
                        <Label htmlFor="account">Account Number</Label>
                        <Input id="account" placeholder="Enter Account Number" />
                    </div>
                     <div>
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input id="ifsc" placeholder="Enter IFSC Code" />
                    </div>
                </CardContent>
            </Card>
        </section>
         <section className="space-y-4">
            <Button variant="secondary" className="w-full justify-start text-base py-6"><UserIcon className="mr-4" /> Refer & Earn</Button>
            <Button variant="secondary" className="w-full justify-start text-base py-6"><FileDown className="mr-4" /> Download Certificates</Button>
        </section>
      </main>
    </div>
  );
}
