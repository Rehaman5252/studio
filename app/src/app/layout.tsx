import "/app/src/styles/globals.css";
import { Providers } from "@/context/Providers";
import { Toaster } from "@/components/ui/toaster";

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
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
