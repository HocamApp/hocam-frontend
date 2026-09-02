"use client";

import { useRef, useState } from "react";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import styles from "./about-continuation.module.css";

const CONTACT_EMAIL = "iletisim@hocamozelders.com";

export function AboutContactButton() {
  const [copyMessage, setCopyMessage] = useState("");
  const addressRef = useRef<HTMLInputElement>(null);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopyMessage("E-posta adresi kopyalandı.");
    } catch {
      setCopyMessage("Adres seçildi. Kopyalama komutuyla kopyalayabilirsin.");
      addressRef.current?.focus();
      addressRef.current?.select();
    }
  }

  return (
    <Popover onOpenChange={() => setCopyMessage("")}>
      <PopoverTrigger asChild>
        <button type="button" className={styles.contact}>
          <EnvelopeSimple size={20} weight="regular" aria-hidden="true" />
          <span>{CONTACT_EMAIL}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={styles.contactOptions}
        align="end"
        sideOffset={12}
        collisionPadding={16}
        aria-label="E-posta ile iletişim"
      >
        <p className={styles.contactOptionsTitle}>Bize e-posta gönder</p>
        <input
          ref={addressRef}
          className={styles.contactAddress}
          aria-label="İletişim e-posta adresi"
          value={CONTACT_EMAIL}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
        <div className={styles.contactActions}>
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Gmail’de yaz
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`}>E-posta uygulamasında aç</a>
          <button type="button" onClick={copyAddress}>Adresi kopyala</button>
        </div>
        <p className={styles.copyMessage} role="status">{copyMessage}</p>
      </PopoverContent>
    </Popover>
  );
}
