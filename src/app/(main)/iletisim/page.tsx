import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";

import { AboutShell } from "@/components/about/AboutSection";

/**
 * Contact page.
 *
 * The form is presentational and says so: nothing here posts anywhere, and a
 * form that silently swallows someone's message is worse than no form. The one
 * channel on this page that actually reaches Hocam is the KVKK mailbox, which
 * is the only real address in the codebase. No phone number and no office
 * address are invented — a made-up number is somebody's real line.
 *
 * Signed-in students and tutors already have a working channel at `/support`;
 * it is auth-gated, so it is offered as a route rather than linked blindly.
 */

export const metadata: Metadata = {
  title: "İletişim",
  description: "Hocam ile iletişime geçin: destek, iş birliği ve KVKK başvuruları.",
  robots: { index: false, follow: true },
};

const CHANNELS = [
  {
    Icon: MessageCircle,
    title: "Hesabın var mı?",
    body: "Ders, rezervasyon ve ödeme konularında en hızlı yol hesabındaki destek merkezi.",
    action: { label: "Destek merkezine git", href: "/support" },
  },
  {
    Icon: ShieldCheck,
    title: "KVKK başvurusu",
    body: "Kişisel verilerinle ilgili talepler için doğrudan KVKK adresimize yazabilirsin.",
    action: { label: "kvkk@hocamozelders.com", href: "mailto:kvkk@hocamozelders.com" },
  },
  {
    Icon: Mail,
    title: "İş birliği ve diğer konular",
    body: "Hoca olmak, kurumsal iş birliği veya basın talepleri için aynı adresi kullanabilirsin.",
    action: { label: "kvkk@hocamozelders.com", href: "mailto:kvkk@hocamozelders.com" },
  },
] as const;

export default function ContactPage() {
  return (
    <article className="pb-16">
      <AboutShell>
        <section className="pt-12 md:pt-16">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">İletişim</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
            Soruların ve önerilerin için buradayız
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Hocam ile ilgili her türlü soru, öneri veya iş birliği talebin için bize
            ulaşabilirsin.
          </p>
        </section>

        <section className="grid gap-5 py-12 md:grid-cols-3">
          {CHANNELS.map(({ Icon, title, body, action }) => (
            <div key={title} className="flex flex-col rounded-2xl border bg-card p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{body}</p>
              <Link
                href={action.href}
                className="mt-4 inline-flex min-h-6 items-center text-sm font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
              >
                {action.label}
              </Link>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border bg-card p-6 md:p-10">
          <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Bize yaz</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Mesaj formu üzerinde çalışıyoruz. Bu arada yukarıdaki e-posta adresi tüm
                talepler için açık — yazdığında aynı ekip okuyor.
              </p>
              <p className="mt-6 inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Form çok yakında
              </p>
            </div>

            {/* Presentational only. Inputs are disabled so nobody types a real
                message into something that cannot deliver it. */}
            <form aria-label="İletişim formu (çok yakında)" className="space-y-4">
              <fieldset disabled className="space-y-4 opacity-60">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Ad Soyad</span>
                    <input
                      type="text"
                      placeholder="Adın ve soyadın"
                      className="mt-1.5 h-11 w-full cursor-not-allowed rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">E-posta</span>
                    <input
                      type="email"
                      placeholder="ornek@eposta.com"
                      className="mt-1.5 h-11 w-full cursor-not-allowed rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium">Mesajın</span>
                  <textarea
                    rows={5}
                    placeholder="Nasıl yardımcı olabiliriz?"
                    className="mt-1.5 w-full cursor-not-allowed rounded-lg border bg-background p-3 text-sm"
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white sm:w-auto sm:px-8"
                >
                  Gönder
                </button>
              </fieldset>
            </form>
          </div>
        </section>
      </AboutShell>
    </article>
  );
}
