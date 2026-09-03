import { TrialLessonPage } from "@/components/trial/TrialLessonPage";
import { publicPageMetadata } from "@/lib/publicSeo";

export const metadata = publicPageMetadata({
  title: "Ücretsiz deneme dersi",
  description: "20 dakikalık ücretsiz deneme dersinde hocanı tanı. Nasıl rezervasyon yapacağını, ayda 3 deneme hakkını ve kullanım koşullarını öğren.",
  path: "/ucretsiz-deneme-dersi",
});

export default function Page() {
  return <TrialLessonPage />;
}
