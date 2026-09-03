"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { sendContactMessage } from "@/lib/contactApi";
import type { ContactMessageRequest } from "@/types/api";
import styles from "./contact.module.css";

export function ContactSimpleForm() {
  const mutation = useMutation({ mutationFn: sendContactMessage });
  const [error, setError] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const text = (name: string) => String(fields.get(name) || "").trim();
    const rawPhone = text("phone");
    const phone = rawPhone
      ? rawPhone.startsWith("+") ? rawPhone : `${text("phone_code")} ${rawPhone}`
      : "";
    submitting.current = true;
    setError("");
    try {
      await mutation.mutateAsync({
        first_name: text("first_name"), last_name: text("last_name"),
        email: text("email"), phone,
        user_type: text("user_type") as ContactMessageRequest["user_type"],
        source: text("source") as ContactMessageRequest["source"],
        message: text("message"), privacy_acknowledged: fields.get("privacy_acknowledged") === "on",
        website: text("website"),
      });
      form.reset();
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (cause) {
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
      setError(status === 429
        ? "Kısa sürede çok fazla mesaj gönderdin. Bir süre sonra tekrar deneyebilirsin."
        : status === 400
          ? "Bilgilerini kontrol et. Ad ve soyad en az 2, mesaj en az 10 karakter olmalı."
          : "Mesajın gönderilemedi. Yazdıkların burada duruyor; tekrar deneyebilir veya iletisim@hocamozelders.com adresine yazabilirsin.");
      requestAnimationFrame(() => statusRef.current?.focus());
    } finally {
      submitting.current = false;
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label="İletişim formu" aria-busy={mutation.isPending}>
      <fieldset disabled={mutation.isPending} className={styles.fields}>
        <div className={styles.fieldPair}>
          <label className={styles.field}>Adın
            <input name="first_name" autoComplete="given-name" placeholder="Adın" minLength={2} maxLength={80} required />
          </label>
          <label className={styles.field}>Soyadın
            <input name="last_name" autoComplete="family-name" placeholder="Soyadın" minLength={2} maxLength={80} required />
          </label>
        </div>
        <label className={styles.field}>E-posta adresin
          <input name="email" type="email" autoComplete="email" placeholder="ornek@eposta.com" maxLength={254} required />
        </label>
        <div className={styles.field}>
          <label htmlFor="contact-phone">Telefon numaran <span className={styles.optional}>(isteğe bağlı)</span></label>
          <div className={styles.phoneGroup}>
            <select name="phone_code" aria-label="Telefon ülke kodu" defaultValue="+90">
              <option value="+90">TR +90</option><option value="+1">US +1</option>
              <option value="+49">DE +49</option><option value="+44">UK +44</option>
              <option value="+994">AZ +994</option><option value="">Diğer</option>
            </select>
            <input id="contact-phone" name="phone" type="tel" autoComplete="tel-national" placeholder="5xx xxx xx xx" pattern={String.raw`[+0-9\s\(\)\-]{7,20}`} maxLength={20} />
          </div>
        </div>
        <div className={styles.fieldPair}>
          <label className={styles.field}>Sen kimsin?
            <select name="user_type" defaultValue="" required>
              <option value="" disabled>Birini seç</option><option value="student">Öğrenci</option>
              <option value="parent">Veli</option><option value="tutor">Hoca</option>
              <option value="institution">Kurum</option><option value="other">Diğer</option>
            </select>
          </label>
          <label className={styles.field}>Bizi nasıl buldun?
            <select name="source" defaultValue="">
              <option value="">Seçebilirsin (isteğe bağlı)</option><option value="social">Sosyal medya</option>
              <option value="google">Google</option><option value="recommendation">Tanıdık önerisi</option>
              <option value="other">Diğer</option>
            </select>
          </label>
        </div>
        <label className={styles.field}>Mesajın
          <textarea name="message" placeholder="Sana nasıl yardımcı olabiliriz?" rows={5} minLength={10} maxLength={5000} required />
        </label>
        <div className={styles.honeypot} aria-hidden="true">
          <label>Web siten<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <label className={styles.privacy}>
          <input name="privacy_acknowledged" type="checkbox" required />
          <span><Link href="/kvkk/aydinlatma-metni" target="_blank" rel="noopener noreferrer">Aydınlatma metnini</Link> okudum. Bilgilerimin iletişim talebime yanıt verilmesi için kullanılacağını biliyorum.</span>
        </label>
        <button type="submit" className={styles.submit}>{mutation.isPending ? "Gönderiliyor…" : "Mesajı gönder"}</button>
      </fieldset>
      {(error || mutation.isSuccess) && (
        <div ref={statusRef} tabIndex={-1} role={error ? "alert" : "status"} className={styles.feedback} data-error={Boolean(error)}>
          {error ? <WarningCircle size={24} aria-hidden="true" /> : <CheckCircle size={24} aria-hidden="true" />}
          <p>{error || "Mesajın ekibimize gönderildi. Yanıtımızı e-posta adresine ileteceğiz."}</p>
        </div>
      )}
    </form>
  );
}
