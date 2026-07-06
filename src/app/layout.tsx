import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { SessionExpiredDialog } from "@/components/shared/SessionExpiredDialog";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hocam",
  description: "YKS hazırlık için özel ders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <div className="flex min-h-screen flex-1 flex-col">{children}</div>
            <SessionExpiredDialog />
          </QueryProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
