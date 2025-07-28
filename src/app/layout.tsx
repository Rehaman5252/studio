import "./globals.css";

export const metadata = {
  title: "IndCric",
  description: "Live Cricket Quiz",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
