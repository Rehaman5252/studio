
import { redirect } from 'next/navigation';

export default function RootPage() {
  // This is a server component that performs an immediate redirect.
  // This is much more efficient than the previous client-side component
  // which required a full render cycle with a loader just to redirect.
  // This ensures the fastest possible entry into the application.
  redirect('/home');
}
