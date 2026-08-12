import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { TutorAcceptanceRequestList } from "@/components/requests/TutorAcceptanceRequestList";

export default function TutorCoachingRequestsPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Yeni öğrenci talepleri"
        description="Ders paketiyle birlikte çalışma koçluğu isteyen öğrencilerin birleşik taleplerini değerlendir. Kabul veya red kararı paketin tamamına uygulanır; kabul etmek ödeme almaz."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Çalışma koçluğu"
        eyebrow="Talepler"
        width="narrow"
        currentHref="/dashboard/tutor/coaching/requests"
        audience="tutor"
      >
        <TutorAcceptanceRequestList surface="coaching" />
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}
