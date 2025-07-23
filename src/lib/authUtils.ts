'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebaseClient';
import { toast } from '@/hooks/use-toast';

export const registerWithEmail = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential;
};

export const loginWithEmail = async (email: string, password:string) => {
    return await signInWithEmailAndPassword(auth, email, password);
};
