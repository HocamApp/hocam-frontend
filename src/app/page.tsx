import type { Metadata } from "next";

import AuthEntryPage from "@/components/auth/AuthEntryPage";

export const metadata: Metadata = {
  title: "Giriş",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function HomePage() {
  return <AuthEntryPage />;
}
