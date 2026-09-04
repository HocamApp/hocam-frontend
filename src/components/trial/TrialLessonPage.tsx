"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock, Plus, VideoCamera } from "@phosphor-icons/react";
import { MONTHLY_TRIAL_LIMIT, TRIAL_MINUTES } from "@/components/yemeksepeti/ysHomeFacts";
import { tutorListHref } from "@/lib/tutorDirectoryLinks";
import { PublicPageIllustration } from "@/components/shared/PublicPageIllustration";
import styles from "./trial-lesson.module.css";

const AGENDA = [
  { label: "Tanış", time: "İlk 5 dakika", title: "Önce birbirinizi tanıyın.", body: "Hangi sınava hazırlanıyorsun? En çok nerede zorlanıyorsun? Hocana hedefini ve derslerden beklentini anlat.", progress: 25 },
  { label: "Birlikte çalış", time: "Sonraki 10 dakika", title: "Bir sorunun başına birlikte oturun.", body: "Takıldığın bir soruyu ya da konuyu paylaş. Hocanın anlatımını, sana nasıl yaklaştığını ve birlikte nasıl çalışabileceğinizi gör.", progress: 75 },
  { label: "Sorularını sor", time: "Son 5 dakika", title: "Aklında soru kalmasın.", body: "Derslerin nasıl ilerleyeceğini konuş. Tanışma bittikten sonra bu hocayla devam edip etmeyeceğine sen karar ver.", progress: 100 },
] as const;

const STEPS = [
  { title: "Hocanı incele", body: "Hoca listesinden sana uygun bir profil seç. Ücretsiz deneme dersi seçeneğinin açık olup olmadığına bak." },
  { title: "Gününü ve saatini seç", body: "Öğrenci hesabınla giriş yap. Hocanın profilindeki ücretsiz deneme seçeneğinden dersi ve müsait bir saati seçerek talebini gönder." },
  { title: "Hocanın onayını bekle", body: "Talebini hesabından takip et. Hoca onayladığında dersin kesinleşir; seçtiğin saati takvimine ayır." },
  { title: "Derse katıl, sonra karar ver", body: "Ders zamanı hesabındaki ders ekranından çevrim içi görüşmeye katıl. Devam etmek istersen hocanın ders paketlerini inceleyebilirsin." },
] as const;

const QUESTIONS = [
  { title: "Deneme dersi için paket almam gerekiyor mu?", body: "Hayır. Deneme dersi ücretsizdir; ödeme yapman veya paket hakkı kullanman gerekmez. Rezervasyon için bir öğrenci hesabın olması yeterlidir." },
  { title: "Aynı hocayla tekrar deneme yapabilir miyim?", body: "Her hocayla bir kez deneme yapabilirsin. Aynı hocayla bekleyen veya kullanılmış bir denemen varsa yeni talep oluşturamazsın. Deneme dışındaki bir ders ilişkin başladıysa da o hocadan ücretsiz deneme alamazsın." },
  { title: "Aylık hakkım ne zaman yenileniyor?", body: `Her takvim ayında en fazla ${MONTHLY_TRIAL_LIMIT} deneme talebi oluşturabilirsin. Sayım, dersin yapılacağı güne göre değil, talebi oluşturduğun aya göre yapılır. Yeni ay başladığında o ay için yeni limit geçerli olur; aynı hocayla bir kez deneme kuralı devam eder.` },
  { title: "Talebim iptal edilirse hakkım ne olur?", body: "İptal edilen, hoca tarafından reddedilen veya süresi dolan talepler aylık limitine dahil edilmez. Bekleyen talepler ise limitten sayılır. Uygun bir saat ve hoca için yeniden talep oluşturabilirsin." },
  { title: "Her hocadan, istediğim zaman deneme alabilir miyim?", body: "Deneme dersini açık tutan hocalardan, takvimlerindeki müsait saatler için talep oluşturabilirsin. Seçeneğin görünmesi, aynı hocayla önceki derslerine ve kalan aylık hakkına da bağlıdır. Talep, hocanın onayından sonra kesinleşir." },
] as const;

function TrialAgenda() {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const step = AGENDA[active];
  return (
    <div className={styles.session}>
      <div className={styles.sessionHeader}>
        <span className={styles.sessionLabel}><VideoCamera size={20} weight="regular" aria-hidden="true" /> Örnek ders akışı</span>
        <span className={styles.duration}><Clock size={16} weight="regular" aria-hidden="true" /> {TRIAL_MINUTES} dk</span>
      </div>
      <div className={styles.agendaControls} role="group" aria-label="Örnek dersin adımları">
        {AGENDA.map((item, index) => (
          <button key={item.label} type="button" aria-pressed={active === index} aria-controls="trial-agenda-content" onClick={() => setActive(index)}>
            <span className={styles.stepNumber}>{index + 1}</span>{item.label}
          </button>
        ))}
      </div>
      <div className={styles.agendaStage} id="trial-agenda-content" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={active} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reducedMotion ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
            <p className={styles.eyebrow}>{step.time}</p>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={styles.track} aria-hidden="true"><motion.span animate={{ width: `${step.progress}%` }} transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeInOut" }} /></div>
    </div>
  );
}

export function TrialLessonPage() {
  return (
    <article className={styles.page}>
      <section className={`${styles.shell} ${styles.hero}`} aria-labelledby="trial-title">
        <div className={styles.heroCopy}>
          <h1 id="trial-title">Hocanı tanı.<br />Derse birlikte<br className={styles.desktopBreak} /> karar ver.</h1>
          <p className={styles.lede}>{TRIAL_MINUTES} dakika boyunca sorularını sor, bir konuya birlikte bak ve hocanın anlatımını tanı. Devam edip etmeyeceğine sonra karar ver.</p>
          <Link href={tutorListHref()} className={styles.primary}>Hoca listesine git <ArrowRight size={20} weight="regular" aria-hidden="true" /></Link>
        </div>
        <TrialAgenda />
      </section>

      <section className={styles.journeyBand} aria-labelledby="trial-journey">
        <div className={`${styles.shell} ${styles.split}`}>
          <div className={styles.sectionIntro}>
            <h2 id="trial-journey">İlk derse giden yol.</h2>
            <div className={styles.journeyArtwork}><PublicPageIllustration kind="meet" /></div>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className={styles.journeyNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.shell} ${styles.rules}`} aria-labelledby="trial-rules">
        <div className={styles.split}>
          <div className={styles.sectionIntro}>
            <h2 id="trial-rules">Bir ayda {MONTHLY_TRIAL_LIMIT} farklı<br />hocayla tanış.</h2>
            <p className={styles.ruleNote}>Bekleyen talepler de limitten sayılır. İptal edilen veya süresi dolan talepler hakkını tüketmez.</p>
          </div>
          <div className={styles.faq}>
            {QUESTIONS.map(question => (
              <details key={question.title} className={styles.question}>
                <summary>{question.title}<Plus size={20} weight="regular" aria-hidden="true" /></summary>
                <p>{question.body}</p>
              </details>
            ))}
          </div>
        </div>
        <div className={styles.closing}>
          <div><h2>İlk tanışma senden.</h2><p>Profilleri incele, deneme dersi sunan hocanı seç.</p></div>
          <Link href={tutorListHref()} className={styles.primary}>Hocaları incele <ArrowRight size={20} weight="regular" aria-hidden="true" /></Link>
        </div>
      </section>
    </article>
  );
}
