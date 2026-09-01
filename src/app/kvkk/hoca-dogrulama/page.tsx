export const metadata = {
  title: "Hoca Doğrulama Aydınlatma Metni",
  description:
    "Üniversite e-postası, öğrenci belgesi ve YKS sonuç belgesi doğrulamasında işlenen kişisel veriler.",
};

const VERSION = "v1.0";
const UPDATED_AT = "23 Ağustos 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-7">{children}</div>
    </section>
  );
}

export default function TutorVerificationNoticePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Hoca Doğrulama Süreci Aydınlatma Metni</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sürüm {VERSION} · {UPDATED_AT}</p>
      <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm leading-6">
        Bu metin, doğrulama bilgilerini göndermeden önce seni bilgilendirir; açık
        rıza veya genel işlem onayı değildir. Veri sorumlusu HOCAM’dır. İletişim:{" "}
        <a href="mailto:kvkk@hocamozelders.com" className="text-primary underline">
          kvkk@hocamozelders.com
        </a>
      </div>

      <div className="mt-10 space-y-10">
        <Section title="Hangi veriler işlenir?">
          <p>
            Üniversiten, bölümün ve beyan ettiğin YKS sıralaman; üniversite e-posta
            adresin, kurumsal alan adı, doğrulama kodunun geri döndürülemez özeti,
            deneme ve doğrulama zamanları işlenir.
          </p>
          <p>
            Alan adı otomatik tanınmazsa e-posta adresin, üniversite beyanın, sorun
            nedeni, admin inceleme durumu/notu ve inceleyen personelin işlem zamanı
            kaydedilir. Bu durum otomatik ret anlamına gelmez.
          </p>
          <p>
            Öğrenci belgen ve ÖSYM/YKS sonuç belgen için dosya güvenlik sonuçları,
            güvenli önizlemeler, belgeyi geri üretmeyen dosya özeti, inceleme kararı
            ve yetkili erişim kayıtları tutulur. Kodun açık değeri saklanmaz; belge
            ve üniversite e-postan herkese açık profilinde yayımlanmaz.
          </p>
        </Section>

        <Section title="Amaç, yöntem ve hukuki sebep">
          <p>
            Bu veriler üniversite gelen kutusu kontrolünü doğrulamak, beyan edilen
            kimlik/YKS bilgisini incelemek, sahte veya tekrarlanan başvuruları önlemek
            ve tutor kabul sürecini yürütmek için elektronik ortamda toplanır.
          </p>
          <p>
            İşleme; KVKK m.5/2-c kapsamındaki sözleşmenin kurulması veya ifası için
            gereklilik ile m.5/2-f kapsamındaki platform güvenliğine ilişkin meşru
            menfaat şartlarına dayandırılır.
          </p>
        </Section>

        <Section title="Kimlere aktarılır?">
          <p>
            E-posta gönderimi için Resend/SMTP, uygulama ve veri tabanı için Railway,
            özel belge depolaması için Supabase kullanılır. Belgeler yalnız gerekli
            yetkiye sahip ve erişimi kaydedilen inceleme personeline açılır; hukuken
            zorunlu olduğunda yetkili kamu kurumlarıyla paylaşılabilir.
          </p>
          <p>
            Bu sağlayıcılar yurt dışında hizmet sunabilir. KVKK m.9 kapsamındaki
            aktarım güvencelerinin mevcut durumu ve devam eden standart sözleşme
            çalışması{" "}
            <a href="/kvkk/aydinlatma-metni" className="text-primary underline">
              genel aydınlatma metninde
            </a>{" "}
            açıklanır.
          </p>
        </Section>

        <Section title="Ne kadar saklanır?">
          <ul className="list-disc space-y-2 pl-5">
            <li>Ham belgeler ve güvenli önizlemeler onaydan sonra 7 gün içinde silinir.</li>
            <li>Reddedilen veya bekleyen başvurularda belge saklama üst sınırı 30 gündür.</li>
            <li>Üniversite e-posta ispatı ve alan adı inceleme kaydı hesap süresince tutulur.</li>
            <li>
              Belgeyi geri üretmeyen özet, karar ve erişim kayıtları tekrar kullanımı
              önleme, denetim ve hakkın korunması için gerekli süreyle sınırlı tutulur.
            </li>
          </ul>
        </Section>

        <Section title="Hakların">
          <p>
            KVKK m.11 kapsamındaki bilgi, düzeltme, silme/yok etme, aktarım yapılan
            kişileri öğrenme, otomatik analiz sonucuna itiraz ve zarar giderimi
            taleplerini{" "}
            <a href="/profile/gizlilik" className="text-primary underline">
              Gizlilik ve Verilerim
            </a>{" "}
            alanından veya kvkk@hocamozelders.com adresinden iletebilirsin. Başvurular
            en geç 30 gün içinde cevaplanır.
          </p>
        </Section>
      </div>

      <a href="/kvkk" className="mt-10 inline-flex min-h-6 items-center text-sm font-medium text-primary underline">
        Tüm KVKK metinleri
      </a>
    </main>
  );
}
