
import { redirect } from 'next/navigation';

// This is the root page of the application.
// We redirect to /home, which is our main landing and content page.
export default function RootPage() {
  redirect('/home');
}
