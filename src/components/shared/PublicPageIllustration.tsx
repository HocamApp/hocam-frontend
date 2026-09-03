import Image from "next/image";
import lesson from "@/assets/illustrations/lesson.png";
import review from "@/assets/illustrations/review.png";
import meet from "@/assets/illustrations/meet.png";
import message from "@/assets/illustrations/message.png";
import styles from "./public-page-illustration.module.css";

const illustrations = { lesson, review, meet, message };

/** Supporting artwork; the adjacent page copy carries all meaningful information. */
export function PublicPageIllustration({
  kind,
  priority = false,
}: {
  kind: keyof typeof illustrations;
  priority?: boolean;
}) {
  return (
    <div className={styles.artwork} aria-hidden="true">
      <Image
        src={illustrations[kind]}
        alt=""
        className={styles.image}
        sizes="(max-width: 767px) 240px, (max-width: 1023px) 320px, 400px"
        priority={priority}
      />
    </div>
  );
}
