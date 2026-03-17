import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";

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
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <div className="flex min-h-screen flex-1 flex-col">{children}</div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
