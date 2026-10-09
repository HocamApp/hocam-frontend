# Homepage rebuild: facts round (task for Claude Code)

Written 8 Oct 2026 from the owners' answers (`Hocam_Ana_Sayfa_Doldurulacak_Bilgiler_CEVAPLI.docx`). Run it as one round.

## Before you start
- Read `AI_AGENT_RULES.md`, `STATUS.md` (this folder) and `HOCAM_HOMEPAGE_PLAN.md`. They bind.
- `git fetch origin --prune` and branch `agent/home-facts-20261008` from `origin/main`. Main has moved: **PR #308 already set `COMMISSION_PERCENT = 17.5`** and added `formatPercent` ("%17,5"). Don't redo it.
- Everything stays behind `NEXT_PUBLIC_HOME_V2`. One PR, merge when green. `git add` explicit files only (iCloud makes " 2" duplicates). Don't touch Vercel Production env vars.
- Run unit tests on **Node 24** (CI uses 24; Node 22.22 fails every file in the test loader).

## 1. Fill these in `src/components/yemeksepeti/ysHomeFacts.ts`

Source comment on each: "Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler)". Don't reword the Turkish.

- `PRICE_RANGE_TL = { min: 400, max: 1400 }`. Comment that the profile form doesn't enforce it.
- `TRIAL_PAID_TO_TUTOR` = `` `Hayır. ${TRIAL_MINUTES} dakikalık deneme dersi öğrenciye ücretsiz; hocaya ayrıca ödeme yapılmaz, hoca bunu gönüllü sunar.` ``
- `TUTOR_NO_SHOW_TEXT` = "Hoca derse gelmezse (15 dakika beklenir) ders iptal olur, ders hakkın paketine geri yüklenir ve sana ek bir telafi dersi hakkı tanımlanır."
- `STUDENT_NO_SHOW_TEXT` = `` `Sen derse gelmezsen ve hoca gelmişse ders yapılmış sayılır ve paketinden bir ders hakkı düşer. ${AUTO_CONFIRM_HOURS} saat içinde itiraz edebilirsin.` ``
  (Baha's answer also had "hoca dersin karşılığını alır". Left out: it's a payout statement and payments aren't live, AI_AGENT_RULES §1–2.)
- `REMAINING_ON_SWITCH_TEXT` = "Paket tek bir hocaya bağlıdır, başka hocaya aktarılmaz. Hoca değiştirmek istersen kalan dersler için iade talebi açarsın: ödediğin tutardan, kullandığın derslerin indirimli birim fiyatı düşülerek hesaplanır; kabul edilince 15 gün içinde iade edilir."
- `TUTOR_MUST_ACCEPT_TEXT` = "Evet, paket taleplerini ve yeni rezervasyonları sen onaylarsın. İstersen profilinden rezervasyonları otomatik onaylamayı açabilirsin. Müsait olmadığın saatleri takviminde kapalı tut."
  (Baha's answer described direct booking. The product doesn't work that way: tutor accepts the package request before payment (`AcceptanceRequestCard`, `paytrStateCopy.ts`), and bookings start "pending" unless the tutor turns on "Rezervasyonları otomatik onayla" on `/profile`. Kullanım Koşulları §8 and İptal ve İade §2–3 say the same. The homepage describes the product as it is.)
- `VERIFICATION_REJECTION_TEXT` = "Tekrar başvurabilirsin, bekleme süresi yok. Ret gerekçesi hesabındaki doğrulama ekranında görünür; güncel belgelerle yeni başvuru açarsın."
- `RECORDING_POLICY_TEXT` = "Hayır. Derslerde ses ve görüntü kaydı alınmaz; yalnızca kimin derse ne zaman katıldığı kaydı tutulur ve 2 yıl saklanır."
- `PARENT_CAN_JOIN_TEXT` = "Hayır. Derse yalnızca öğrenci ve hoca katılır; ayrı bir veli hesabı yok. 18 yaş altı öğrenciler platformu veli bilgisi ve onayıyla kullanır."
- `PARENT_CAN_PAY_TEXT` = "Ayrı bir veli hesabı yok; ödeme öğrencinin hesabı üzerinden yapılır."
- `SUPPORT_REPLY_TEXT` = "24 saat" (the copy reads "… X içinde dönüyoruz.")
- `OFF_PLATFORM_TEXT` = "Platform dışında ders yapmak veya ödeme almak yasaktır; tespit edilirse hesap askıya alınabilir."
- `COACHING_TUTOR_TEXT` = "Koçluk, öğrencinin ders paketine bağlı ek hizmettir; tek başına alınmaz. Hoca kendi koçluk planını açar: 30 dakikalık görüşmeler, çalışma programı, deneme değerlendirmesi, ilerleme raporu ve mesajlara 24 saat içinde yanıt." (still only renders with the coaching flag on)

All of these were checked against `/iptal-ve-iade` (§4 no-show, §5 24h dispute, §9 refund formula, §11 manual refund within 15 days), `/kvkk/saklama-ve-imha-politikasi` (attendance records 2 yıl) and the ders odası FAQ (no recording). They match. Recheck if those pages changed since.

## 2. Payment sentences: filled, but PayTR-gated

Payments aren't live. These render only when `PAYTR_ENABLED` (`src/lib/featureFlags.ts`) is true. Otherwise they're `null`, not `TODO`, so they don't block the build.

- `PAYMENT_CHARGED_WHEN: string | null = PAYTR_ENABLED ? "Hocan paket talebini onaylayınca ödeme ekranı açılır; kartından o anda çekilir." : null`
- `TUTOR_PAYOUT_TEXT: string | null = PAYTR_ENABLED ? "Ders ve koçluk kazançların haftada bir, toplu olarak aktarılır: onaylanan ve itiraz süresi geçen dersler o haftanın ödemesine girer." : null`

Make `YsFact` render nothing for `null`/`undefined` (today it would print "null"). The existing "Paket talebini oluştururken kartından ücret alınmaz." lines in student step 5 and the payment guarantee card stay as they are.

## 3. Facts that change shape

- `VERIFICATION_REVIEW_DAYS` (number) → `VERIFICATION_REVIEW_TIME: Fact<string> = "1–2 iş günü"`. Every copy slot that appends `" gün içinde"` becomes `" içinde"`: `band.checklistFoot`, tutor step "Doğrulan", `pages.verification.faq.reviewTime`. Consumers: `YsVerifiedBand`, `YsTutorBand`, `/hocalar-nasil-dogrulaniyor`.
- `VERIFICATION_DOCS_DELETED_AFTER`: delete. Build the band's footer from the existing `VERIFICATION_DOCS_DELETE_DAYS_AFTER_APPROVAL` (7) and `VERIFICATION_DOCS_MAX_RETENTION_DAYS` (30): "Başvurular X içinde sonuçlanır. Belgeler profilde hiçbir zaman görünmez; onaylanan başvuruda 7 gün içinde, reddedilen ya da bekleyen başvuruda en geç 30 gün içinde silinir."
- `TUTOR_MIN_WEEKLY_HOURS`: no minimum. Delete the fact and the "Haftada en az X saat ayırabilmek" eligibility line (tutor band card and `/hocalar-nasil-dogrulaniyor`, including its production filter). The Hoca FAQ "hoca-saat" answer becomes the plain string "Alt sınır yok. Müsaitlik takvimini sen belirlersin; gerçek durumuna uygun tut."
- `TAX_TEXT`: no answer yet (needs the accountant). Make it `string | null = null`, not `TODO`. The Hoca FAQ skips the "hoca-vergi" item while it's null, and the FAQPage JSON-LD skips it too.
- `COMPANY_LEGAL_NAME`, `COMPANY_ADDRESS`, `COMPANY_MERSIS`: the footer doesn't need company info (Baha). Delete the facts, `CompanyLine` in `YsFooter.tsx` and `footer.mersis` in the copy. Keep the "KVKK başvuru: iletisim@hocamozelders.com" line on its own.

## 4. Tests that will need updating

These assert the facts are still TODO:
- `YsHomePhaseB.test.tsx` "marks the undecided answers instead of inventing them": should now assert no `[data-todo-fact]`, the no-show and switch answers render, and no PayTR sentence (and no "null") with the flag off.
- `YsHomePhaseC.test.tsx` "leaves TODO answers out of production and out of the JSON-LD": every audience's entries are now non-pending and render in production; JSON-LD includes "Ödemeyi ben yapabilir miyim?" and excludes the tax question.
- `YsHomePhaseC.test.tsx` "flattens facts and links to plain text": the last assertion flips to `false` (no TODO left in the tutor tab).

## 5. Checks
1. `NEXT_PUBLIC_HOME_V2=true npx tsx scripts/check-home-facts.ts` with `ALLOW_HOME_TODOS` unset: exit 0.
2. `npm run lint`, `npx tsc --noEmit`, `npm run test:unit` (Node 24), `npm run responsive:check`.
3. No em dashes, no exclamation marks, sen register, currency after the number, no IBAN.
4. `npm run home:compare` with `NEXT_PUBLIC_PAYTR_ENABLED` off. Attach screenshots to the PR.
5. Update `STATUS.md`: drop the TODO table, add the decisions below, keep "Open for Baha" current.

Decisions to add to STATUS.md:
- Facts filled 8 Oct 2026 from the owners' answers.
- Payment timing and tutor payout texts are PayTR-gated (`null` while payments are off).
- The homepage keeps the request/accept flow because that's what the product does. Direct booking would be its own product + backend + legal round.
- Tax FAQ hidden until accountant-approved text exists.
- No company details in the footer.

Report: PR link, merge SHA, check-home-facts result, anything that disagreed with the legal pages.
