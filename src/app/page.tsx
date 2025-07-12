
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

// This is a server component.
// NOTE: auth.currentUser on the server will ALWAYS be null with the client SDK.
// The redirect logic in the /home page's client component will handle
// redirecting unauthenticated users to /auth/login.
// This page simply provides the fastest entry into the app.
export default async function RootPage() {
  redirect('/home');
}
