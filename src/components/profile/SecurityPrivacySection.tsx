"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Eye, LogOut, Monitor, ShieldCheck } from "lucide-react";

import { ProfileAccordionSection } from "@/components/profile/ProfileAccordionSection";
import { ProfileToggleRow } from "@/components/profile/ProfileMenuRow";
import { Button } from "@/components/ui/button";
import { exportMyData } from "@/lib/profileApi";
import { logoutAllSessions } from "@/lib/authApi";

const SECTION_KEYS = ["visibility", "sessions", "export"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

interface SecurityPrivacySectionProps {
  isTutor: boolean;
  isPublic: boolean;
  onVisibilityToggle: (next: boolean) => void;
  onLogout: () => void;
}

export function SecurityPrivacySection({
  isTutor,
  isPublic,
  onVisibilityToggle,
  onLogout,
}: SecurityPrivacySectionProps) {
  const [openKey, setOpenKey] = useState<SectionKey | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [exporting, setExporting] = useState(false);

  const activeIndex = openKey ? SECTION_KEYS.indexOf(openKey) : -1;

  const sectionProps = (key: SectionKey) => {
    const index = SECTION_KEYS.indexOf(key);
    const isOpen = openKey === key;
    const previousIsOpen = activeIndex === index - 1;
    const nextIsOpen = activeIndex === index + 1;
    return {
      open: isOpen,
      onToggle: () => setOpenKey((curr) => (curr === key ? null : key)),
      startsGroup: isOpen || index === 0 || previousIsOpen,
      endsGroup: isOpen || index === SECTION_KEYS.length - 1 || nextIsOpen,
      separatedFromPrevious: index > 0 && (isOpen || previousIsOpen),
    };
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllSessions();
      toast.success("Tüm oturumlardan çıkış yapıldı.");
      onLogout();
    } catch {
      toast.error("Oturumlar kapatılamadı. Lütfen tekrar deneyin.");
      setLoggingOutAll(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hocam-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Verileriniz indirildi.");
    } catch {
      toast.error("Veriler indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h2 className="mb-3 px-1 text-base font-semibold text-foreground">
        Güvenlik ve gizlilik
      </h2>
      <div>
        <ProfileAccordionSection
          icon={<Eye className="h-4 w-4" />}
          title="Hesap görünürlüğü"
          {...sectionProps("visibility")}
        >
          {isTutor ? (
            <>
              <ProfileToggleRow
                label="Profilim herkese açık olsun"
                checked={isPublic}
                onChange={onVisibilityToggle}
                icon={<Eye className="h-4 w-4" />}
              />
              <p className="px-2 text-xs text-muted-foreground">
                {isPublic
                  ? "Profiliniz hoca listesinde görünür ve öğrenciler tarafından bulunabilir."
                  : "Profiliniz şu anda gizli; hoca listesinde ve aramalarda görünmez. Mevcut konuşmalarınız ve panonuz etkilenmez."}
              </p>
            </>
          ) : (
            <div className="flex gap-3 px-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Öğrenci profilleri herkese açık değildir. Bilgileriniz yalnızca ders
                aldığınız hocalarla ve platform politikası gereği gerekli durumlarda
                paylaşılır.
              </p>
            </div>
          )}
        </ProfileAccordionSection>

        <ProfileAccordionSection
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Oturumları yönet"
          {...sectionProps("sessions")}
        >
          <p className="px-2 text-sm text-muted-foreground">
            Hesabınıza birden fazla cihazdan giriş yapmış olabilirsiniz.
            Cihazlarınızı tek tek görüntüleyemezsiniz; tüm cihazlardan aynı anda
            çıkış yapmak isterseniz aşağıdaki seçeneği kullanabilirsiniz.
          </p>
          <div className="flex flex-col gap-2 px-2">
            <Button variant="outline" className="w-full" onClick={onLogout}>
              <Monitor className="mr-2 h-4 w-4" />
              Bu cihazdan çıkış yap
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
            >
              {loggingOutAll ? (
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Tüm oturumlardan çıkış yap
            </Button>
          </div>
        </ProfileAccordionSection>

        <ProfileAccordionSection
          icon={<Download className="h-4 w-4" />}
          title="Verilerimi indir"
          {...sectionProps("export")}
        >
          <p className="px-2 text-sm text-muted-foreground">
            Hesabınıza ait verileri (profil, tercihler, destek talepleri, ders
            talepleri ve rezervasyonlar) JSON dosyası olarak indirebilirsiniz.
            Yalnızca size ait veriler dışa aktarılır.
          </p>
          <div className="px-2">
            <Button variant="outline" onClick={handleExportData} disabled={exporting}>
              {exporting ? (
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Verilerimi indir
            </Button>
          </div>
        </ProfileAccordionSection>
      </div>
    </div>
  );
}
