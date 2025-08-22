import BottomNav from '@/components/BottomNav';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main>{children}</main>
      <BottomNav />
    </>
  );
}
