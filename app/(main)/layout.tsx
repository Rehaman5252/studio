import BottomNav from '@/components/BottomNav';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-md bg-background">
        <main>{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
