import { TutorAcceptanceRequestList } from "@/components/requests/TutorAcceptanceRequestList";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function TutorRequestsPage() {
  return (
    <RouteGuard requireRole="tutor">
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-2 border-b pb-5">
          <h1 className="text-2xl font-semibold tracking-tight">Paket Talepleri</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Daha önce gelmiş ders paketi taleplerini buradan yanıtlarsın. Yeni ders paketleri onayını beklemez: öğrenci senin yayınladığın boş saatleri seçip öder, dersler ödemeden sonra doğrudan takvimine eklenir. Çalışma koçluğu içeren birleşik talepler Koçluk alanında ayrı gösterilir.
          </p>
        </header>
        <TutorAcceptanceRequestList surface="lessonOnly" />
      </main>
    </RouteGuard>
  );
}
