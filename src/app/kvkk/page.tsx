import Link from "next/link";

export const metadata = {
  title: "KVKK ve Gizlilik",
  description:
    "HOCAM’ın kişisel verilerini nasıl işlediğine dair tüm bilgilendirme metinleri.",
};

const DOCUMENTS = [
  {
    href: "/kvkk/aydinlatma-metni",
    title: "Aydınlatma Metni",
    description:
      "Hangi verilerini, neden işlediğimizi, kimlerle paylaştığımızı ve haklarını anlatır.",
  },
  {
    href: "/kvkk/hoca-dogrulama",
    title: "Hoca Doğrulama Aydınlatma Metni",
    description:
      "Üniversite e-postası, öğrenci belgesi ve YKS belgesinin nasıl incelendiğini ve ne kadar saklandığını anlatır.",
  },
  {
    href: "/kvkk/cerez-politikasi",
    title: "Çerez Politikası",
    description:
      "Hangi çerezleri kullandığımızı ve tercihini nasıl değiştirebileceğini anlatır.",
  },
  {
    href: "/kvkk/analitik",
    title: "Analitik Aydınlatma Metni",
    description:
      "Hoca bulma deneyimini ölçmek için tutulan keşif kayıtlarını anlatır.",
  },
  {
    href: "/kvkk/ogrenci-gelisim-kayitlari",
    title: "Öğrenci Gelişim Kayıtları",
    description:
      "Derslerde tutulan öğrenme takibi kayıtlarını anlatır.",
  },
];

export default function KvkkIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">KVKK ve Gizlilik</h1>
      <p className="mt-3 text-muted-foreground">
        Verilerini nasıl kullandığımızı gizlemeye çalışmıyoruz. Aşağıdaki
        metinler, hangi bilgini neden tuttuğumuzu ve bu konuda ne
        yapabileceğini anlatır.
      </p>

      <ul className="mt-8 space-y-3">
        {DOCUMENTS.map((doc) => (
          <li key={doc.href}>
            <Link
              href={doc.href}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <span className="font-semibold">{doc.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {doc.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-lg border bg-muted/40 p-4 text-sm leading-6">
        Mevcut onaylarını geri almak ve çevrimiçi başvuru kanalının durumunu görmek için{" "}
        <Link href="/profile/gizlilik" className="text-primary underline">
          Gizlilik ve Verilerim
        </Link>{" "}
        sayfasına gidebilir, ya da kvkk@hocamozelders.com adresine
        yazabilirsin.
      </div>
    </main>
  );
}
