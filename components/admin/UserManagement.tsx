'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, startAfter, limit, getDocs, DocumentData, QueryDocumentSnapshot, endBefore, limitToLast } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mapFirestoreError } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface User {
  id: string;
  name: string;
  email: string;
  quizzesPlayed: number;
  totalScore: number;
  photoURL?: string;
}

const ROWS_PER_PAGE = 15;

const UserSkeleton = () => (
    <TableRow>
        <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
    </TableRow>
)

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [page, setPage] = useState(1);
    const [pageHistory, setPageHistory] = useState<(QueryDocumentSnapshot<DocumentData> | null)[]>([null]);

    const fetchUsers = useCallback(async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
        setIsLoading(true);
        setError(null);
        if (!db) {
            setError("Database connection not available.");
            setIsLoading(false);
            return;
        }

        try {
            let q;
            
            if (direction === 'next' && lastVisible) {
                q = query(collection(db, 'users'), orderBy('name'), startAfter(lastVisible), limit(ROWS_PER_PAGE));
            } else if (direction === 'prev' && page > 1) {
                const prevLastVisible = pageHistory[page-2];
                if(prevLastVisible) {
                    q = query(collection(db, 'users'), orderBy('name'), startAfter(prevLastVisible), limit(ROWS_PER_PAGE));
                } else {
                     q = query(collection(db, 'users'), orderBy('name'), limit(ROWS_PER_PAGE));
                }
            } else { // initial
                 q = query(collection(db, 'users'), orderBy('name'), limit(ROWS_PER_PAGE));
            }

            const documentSnapshots = await getDocs(q);
            const fetchedUsers: User[] = [];
            documentSnapshots.forEach((doc) => {
                const data = doc.data();
                fetchedUsers.push({
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    quizzesPlayed: data.quizzesPlayed || 0,
                    totalScore: data.totalScore || 0,
                    photoURL: data.photoURL,
                });
            });

            if (!documentSnapshots.empty) {
                const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
                setLastVisible(newLastVisible);
                
                if (direction === 'next') {
                    setPageHistory(prev => [...prev, newLastVisible]);
                }
            }
            setUsers(fetchedUsers);

        } catch (err: any) {
            console.error("Error fetching users:", err);
            const mappedError = mapFirestoreError(err);
            setError(mappedError.userMessage);
        } finally {
            setIsLoading(false);
        }

    }, [lastVisible, page, pageHistory]);

    useEffect(() => {
        // For now, search is disabled. Will be implemented with a proper search solution.
        fetchUsers('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm]);

    const handleNextPage = () => {
        if (!lastVisible) return;
        setPage(p => p + 1);
        fetchUsers('next');
    };
    
    const handlePrevPage = () => {
        if (page <= 1) return;
        setPage(p => p - 1);
        setPageHistory(prev => prev.slice(0, -1));
        fetchUsers('prev');
    };

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 5 }).map((_, i) => <UserSkeleton key={i} />);
        }

        if (error) {
            return (
                <TableRow>
                    <TableCell colSpan={5}>
                        <Alert variant="destructive">
                            <AlertTitle>Error Loading Users</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            );
        }
        
        if (users.length === 0) {
            return <TableRow><TableCell colSpan={5} className="text-center">No users found.</TableCell></TableRow>;
        }

        return users.map(user => (
            <TableRow key={user.id}>
                <TableCell>
                    <Avatar>
                        <AvatarImage src={user.photoURL} alt={user.name} />
                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-center">{user.quizzesPlayed}</TableCell>
                <TableCell className="text-center">{user.totalScore}</TableCell>
            </TableRow>
        ));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Browse and manage platform users.</p>
                </div>
                <div className="w-1/3 relative">
                    <Input 
                        placeholder="Search users... (disabled)" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                        disabled
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Avatar</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Quizzes Played</TableHead>
                            <TableHead className="text-center">Total Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderContent()}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                 <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={users.length < ROWS_PER_PAGE || !lastVisible}>
                    Next <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
