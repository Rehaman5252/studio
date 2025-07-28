export const metadata = {
  title: "IndCric",
  description: "India’s quiz app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
