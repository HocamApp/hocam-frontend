import Link from "next/link";

export const metadata = { title: "Öğrenci Gelişim Kayıtları Aydınlatma Metni" };

export default function StudentProgressNoticePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Öğrenci Gelişim Kayıtları Aydınlatma Metni</h1>
      <p className="mt-4 text-muted-foreground">
        Bu kayıt özelliği, hukuki değerlendirme tamamlanıp yalnızca açıkça seçilmiş pilot
        öğretmenler için etkinleştirilene kadar kapalıdır.
      </p>

      <div className="mt-8 space-y-5 text-sm leading-7">
        <section>
          <h2 className="font-semibold">Hangi bilgiler kaydedilir?</h2>
          <p>
            Tamamlanmış bir ders için işlenen müfredat konusu, konuya ne ölçüde değinildiği,
            öğretmenin dersteki anlama ve destek ihtiyacı gözlemi ile önerilen sonraki adım
            kaydedilebilir. Belge içeriği, sağlık verisi veya öğrencinin özel hayatına ilişkin
            serbest metin istenmez.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Amaç ve yorum sınırı</h2>
          <p>
            Amaç ders devamlılığını ve bir sonraki dersin hazırlığını desteklemektir. Kayıtlar
            öğretmen gözlemidir; sınav sonucu, kesin seviye, tanı veya nesnel başarı ölçümü
            olarak sunulmaz. Otomatik karar, öğretmen sıralaması veya öğrenciye dönük otomatik
            yönlendirme üretmez.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Kimler erişebilir?</h2>
          <p>
            Kayıt, ilgili öğrenciyle ders ilişkisi bulunan ve kaydı oluşturan doğrulanmış
            öğretmenin özel öğrenci notları alanında tutulur. Yetkili teknik ve hukuki
            operasyonlar dışında başka öğretmenlere veya herkese açık profillere gösterilmez.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Düzeltme, silme ve saklama</h2>
          <p>
            Öğretmen yanlış kaydı düzeltebilir; değişiklik geçmişi güvenlik ve denetim amacıyla
            korunur. Öğrenci veya velisi, uygulanabilir KVKK hakları kapsamında bilgi alma,
            düzeltme ve silme talebini destek kanalı üzerinden iletebilir. Önerilen azami saklama
            süresi son güncellemeden itibaren 12 aydır ve süre sonunda çalışan idempotent silme
            mekanizması hazırlanmıştır. Süre ve hukuki dayanak nitelikli hukuk incelemesinde
            doğrulanmadan üretimde etkinleştirilmez.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Araştırma kullanımı</h2>
          <p>
            Yeterli ve uygun veri oluşursa yalnızca çevrimdışı yöntem araştırmalarında
            kimliği doğrudan göstermeyen biçimde kullanılabilir. Bu araştırma gerçek öğrenme
            kazanımı veya öğretmenin nedensel etkisi olarak sunulmaz ve canlı eşleştirmeyi
            kendiliğinden değiştiremez.
          </p>
        </section>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm font-medium text-primary underline">
        Hocam’a dön
      </Link>
    </main>
  );
}
