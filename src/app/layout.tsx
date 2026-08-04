import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { SessionExpiredDialog } from "@/components/shared/SessionExpiredDialog";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { DiscoveryConsentBanner } from "@/components/privacy/DiscoveryConsentBanner";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Hocam | YKS için Online Özel Ders",
    template: "%s | Hocam",
  },
  description: SITE_DESCRIPTION,
  category: "education",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE_NAME,
    title: "Hocam | YKS için Online Özel Ders",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/brand/hocam-logo.png",
        width: 1024,
        height: 1024,
        alt: "Hocam",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Hocam | YKS için Online Özel Ders",
    description: SITE_DESCRIPTION,
    images: ["/brand/hocam-logo.png"],
  },
  icons: {
    icon: [{ url: "/brand/hocam-logo.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/brand/hocam-logo.png`,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: SITE_NAME,
              url: SITE_URL,
              inLanguage: "tr-TR",
              publisher: {
                "@id": `${SITE_URL}/#organization`,
              },
            },
          ]}
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <LanguageProvider>
              <ImpersonationBanner />
              <div className="flex min-h-screen flex-1 flex-col">{children}</div>
              <SessionExpiredDialog />
              <DiscoveryConsentBanner />
            </LanguageProvider>
          </QueryProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
