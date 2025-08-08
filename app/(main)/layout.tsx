
import BottomNav from "@/components/BottomNav";

// This layout wraps the main pages of the app that require bottom navigation.
export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
