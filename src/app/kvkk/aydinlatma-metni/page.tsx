import Link from "next/link";

export const metadata = {
  title: "Aydınlatma Metni",
  description:
    "HOCAM’ın kişisel verilerini hangi amaçla işlediğini, kimlere aktardığını ve haklarını anlatan KVKK aydınlatma metni.",
};

// Kept in sync with hocam-backend/docs/kvkk/01-genel-aydinlatma-metni.md.
// The document is the source of truth; this page renders it.
const VERSION = "v1.0";
const UPDATED_AT = "16 Ağustos 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-7">{children}</div>
    </section>
  );
}

export default function AydinlatmaMetniPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">
        Kişisel Verilerin Korunması Hakkında Aydınlatma Metni
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sürüm {VERSION} · {UPDATED_AT}
      </p>

      <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm leading-6">
        Bu metin seni bilgilendirir, senden onay istemez. Onayın gereken
        durumlarda ayrıca ve açıkça sorarız. Onaylarını{" "}
        <Link href="/profile/gizlilik" className="text-primary underline">
          Gizlilik ve Verilerim
        </Link>{" "}
        sayfasından yönetebilirsin.
      </div>

      <div className="mt-10 space-y-10">
        <Section title="1. Kimiz">
          <p>
            HOCAM, YKS’ye hazırlanan öğrencilerle doğrulanmış üniversite
            öğrencisi öğretmenleri buluşturan çevrimiçi bir özel ders
            platformudur. Bu platformda işlenen kişisel veriler bakımından veri
            sorumlusu HOCAM’dır.
          </p>
        </Section>

        <Section title="2. Hangi verilerini işliyoruz">
          <p>
            <strong>Herkes için:</strong> e-posta adresin, adın ve soyadın,
            hesap tercihlerin, bildirim ayarların, giriş ve işlem güvenliği
            kayıtların.
          </p>
          <p>
            <strong>Öğrenciysen:</strong> okulun, sınıfın, hedeflediğin sınav ve
            sıralama, tanıtım yazın, profil görselin, ders taleplerin ve
            rezervasyonların, öğretmeninle mesajların, çözdüğün sorular ve
            sonuçları, öğrenme hedeflerin, satın aldığın paketler ve ödeme
            kayıtların, yaptığın değerlendirmeler.
          </p>
          <p>
            <strong>Öğretmensen:</strong> bunlara ek olarak üniversiten,
            bölümün, YKS sıralaman, tanıtım videon, saatlik ücretin, müsaitlik
            takvimin ve doğrulama için ilettiğin öğrenci belgen ile YKS sonuç
            belgen.
          </p>
          <p className="font-medium">
            Görüntülü derslerinin ses ve görüntü kaydını almıyoruz. Yalnızca
            derse kimin ne zaman katıldığını tutuyoruz.
          </p>
        </Section>

        <Section title="3. Neden işliyoruz">
          <p>
            Hesabını oluşturmak, dersini gerçekleştirmek, ödeme ve iade
            işlemlerini yürütmek, faturaları kanunun zorunlu kıldığı süre
            boyunca saklamak, şikayet ve uyuşmazlıkları incelemek, platformu
            güvende tutmak ve işleyişe dair sana bilgi vermek için.
          </p>
          <p>
            Öğretmen profilinin herkese açık gösterilmesi, öğrenme takibi, sana
            özel öneriler, yapay zekâ asistanı ve tanıtım e-postaları{" "}
            <strong>yalnızca açık rızanla</strong> yapılır. Bu onayları
            istediğin an geri alabilirsin. Rızaya dayanmayan işlemler
            (sözleşmenin ifası, mali kayıt saklama) onayından bağımsız devam
            eder.
          </p>
        </Section>

        <Section title="4. Kimlerle paylaşıyoruz">
          <p>
            Ders ilişkisi kurduğun öğretmen veya öğrenci, yalnızca o ilişki için
            gereken bilgilerini görür. Öğrenciler birbirinin verisini görmez.
          </p>
          <p>
            Hizmet sağlayıcılarımız: Railway (uygulama ve veri tabanı),
            Supabase (belge ve görsel depolama), Vercel (web sitesi), 8x8/JaaS
            (görüntülü ders), Google (Google ile giriş ve yapay zekâ asistanı),
            Resend (e-posta). Ayrıca kanunen talep edilmesi halinde yetkili
            kurumlarla.
          </p>
        </Section>

        <Section title="5. Yurt dışına aktarım">
          <p>
            Yukarıdaki sağlayıcıların sunucuları Türkiye dışındadır, bu nedenle
            verilerin yurt dışına aktarılır.
          </p>
          <p>
            KVKK’nın 9. maddesi bu aktarımlar için uygun güvenceler öngörür.
            Sağlayıcılarımızla imzalanacak <strong>standart sözleşmelerin
            hazırlık süreci devam etmektedir</strong>; tamamlandığında
            sözleşmeler Kişisel Verileri Koruma Kurulu’na bildirilecek ve bu
            sayfa güncellenecektir. Süreç tamamlanmadan bu konuda kesin bir
            beyanda bulunmuyoruz.
          </p>
        </Section>

        <Section title="6. Ne kadar saklıyoruz">
          <p>
            Hesap bilgilerin hesabın açık olduğu sürece; ders ve rezervasyon
            kayıtların 10 yıl; mesajların hesap kapanışından itibaren 1 yıl;
            öğretmen doğrulama belgeleri karardan itibaren 2 yıl; analitik
            veriler 12 ay saklanır.
          </p>
          <p>
            <strong>Fatura ve mali kayıtlar 10 yıl saklanır</strong> ve vergi ve
            ticaret mevzuatı gereği silme talebiyle kaldırılamaz. Süre dolduğunda
            veriler silinir, yok edilir veya anonim hale getirilir.
          </p>
        </Section>

        <Section title="7. Haklarım neler">
          <p>
            Verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, amaca
            uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü
            kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme,
            şartları oluşmuşsa silinmesini isteme, otomatik analiz sonucu
            aleyhine bir sonuç çıkmasına itiraz etme ve zararın giderilmesini
            talep etme haklarına sahipsin.
          </p>
          <p>
            Başvurunu{" "}
            <Link href="/profile/gizlilik" className="text-primary underline">
              Gizlilik ve Verilerim
            </Link>{" "}
            sayfasından veya kvkk@hocamozelders.com adresinden iletebilirsin.
            En geç 30 gün içinde cevaplarız. Cevabımızı yetersiz bulursan
            Kişisel Verileri Koruma Kurulu’na şikâyette bulunabilirsin.
          </p>
        </Section>

        <Section title="8. 18 yaşından küçüksen">
          <p>
            Rızana dayalı özellikler için velinin veya vasinin onayı gerekir.
            Kayıt sırasında doğum tarihini sorar, 18 yaşından küçüksen velinin
            e-postası üzerinden onayını alırız.
          </p>
          <p>
            Veli onayı alınmadan öğrenme takibi, öneri sistemi, yapay zekâ
            asistanı ve tanıtım e-postaları senin için kapalı kalır;{" "}
            <strong>ders alma ve mesajlaşma çalışmaya devam eder.</strong> Velin
            senin adına tüm haklarını kullanabilir.
          </p>
        </Section>

        <Section title="9. Özel nitelikli veriler">
          <p>
            Sağlık, inanç, etnik köken gibi özel nitelikli verilerini toplamıyor
            ve istemiyoruz. Mesaj, destek talebi veya yapay zekâ asistanı gibi
            serbest yazı alanlarına bu tür bilgileri yazmamanı rica ederiz.
          </p>
        </Section>

        <Section title="10. Güvenlik">
          <p>
            Rol bazlı erişim denetimi, şifreleme, şifrelerin geri döndürülemez
            saklanması, belgelere yalnızca kısa süreli imzalı bağlantılarla
            erişim ve yönetici işlemlerinin denetim kaydı gibi tedbirleri
            uygularız. Bir ihlal yaşanırsa 72 saat içinde Kurul’a, sana ise en
            kısa sürede bildiririz.
          </p>
        </Section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/kvkk/cerez-politikasi" className="text-primary underline">
          Çerez Politikası
        </Link>
        <Link href="/kvkk/analitik" className="text-primary underline">
          Analitik Aydınlatma Metni
        </Link>
        <Link href="/" className="text-primary underline">
          Hocam’a dön
        </Link>
      </div>
    </main>
  );
}
