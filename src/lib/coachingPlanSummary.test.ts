import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  CoachingCapacityDetail,
  CoachingPlan,
  CoachingRevenuePreview,
  CoachingSetupConfig,
} from "./coachingApi";
import { buildCoachingSettingRows } from "./coachingPlanSummary";

const plan: CoachingPlan = {
  id: "plan-1",
  frequency: "weekly",
  session_duration_minutes: 30,
  price_per_session_minor: 60000,
  price_per_session_display: "600,00 ₺",
  price_cap_minor: 90000,
  max_active_students: 6,
  target_exam_types: ["YKS", "DGS"],
  description: "İlk görüşmede seviyeni çıkarıp haftalık programı birlikte yazarız.",
  is_published: true,
  is_accepting_new_students: true,
  published_at: "2026-10-02T09:00:00Z",
  capacity: null,
  created_at: "2026-10-01T09:00:00Z",
  updated_at: "2026-10-02T09:00:00Z",
};

const setupConfig: CoachingSetupConfig = {
  exam_groups: ["YKS", "DGS", "KPSS"],
  session_duration_minutes: 30,
  lesson_price_minor: 80000,
  lesson_price_display: "800,00 ₺",
  max_price_ratio_percent: 100,
  price_cap_minor: 90000,
  price_cap_display: "900,00 ₺",
  commission_bps: 1750,
  frequency_options: [
    {
      value: "weekly",
      label: "Haftada bir",
      packages: [
        { duration_days: 14, weeks: 2, total_sessions: 2 },
        { duration_days: 30, weeks: 4, total_sessions: 4 },
      ],
    },
  ],
};

const capacity: CoachingCapacityDetail = {
  weekly_slot_count: 12,
  theoretical_capacity: 8,
  max_active_students: 6,
  active_students: 3,
  is_accepting_new_students: true,
  can_accept_new_student: true,
  slots: [
    { day_of_week: 4, start_time: "18:00" },
    { day_of_week: 0, start_time: "18:00" },
    { day_of_week: 0, start_time: "19:00" },
    { day_of_week: 2, start_time: "20:00" },
    { day_of_week: 5, start_time: "11:00" },
  ],
};

const revenue: CoachingRevenuePreview = {
  commission_bps: 1750,
  unit_price_minor: 60000,
  unit_price_display: "600,00 ₺",
  rows: [
    {
      duration_days: 30,
      weeks: 4,
      total_sessions: 4,
      discount_percent: 0,
      subtotal_price_minor: 240000,
      subtotal_price_display: "2.400,00 ₺",
      discount_amount_minor: 0,
      discount_amount_display: "0,00 ₺",
      total_price_minor: 240000,
      total_price_display: "2.400,00 ₺",
      platform_fee_minor: 42000,
      platform_fee_display: "420,00 ₺",
      tutor_net_minor: 198000,
      tutor_net_display: "1.980,00 ₺",
    },
  ],
};

function byStep(rows: ReturnType<typeof buildCoachingSettingRows>) {
  return Object.fromEntries(rows.map((row) => [row.step, row]));
}

describe("buildCoachingSettingRows", () => {
  it("lists the six settings in the order the wizard asks for them", () => {
    const rows = buildCoachingSettingRows({ plan, setupConfig, capacity, revenue });
    assert.deepEqual(
      rows.map((row) => row.step),
      ["frequency", "price", "exams", "description", "availability", "capacity"]
    );
  });

  it("describes the meeting rhythm with the package it produces", () => {
    const { frequency } = byStep(buildCoachingSettingRows({ plan, setupConfig, capacity, revenue }));
    assert.equal(frequency.label, "Görüşme düzeni");
    assert.equal(frequency.value, "Haftada bir");
    assert.equal(frequency.hint, "4 haftalık pakette 4 görüşme · her görüşme 30 dk");
    assert.equal(frequency.chip, "Haftada bir");
  });

  it("writes lira after the number and shows what the tutor keeps", () => {
    const { price } = byStep(buildCoachingSettingRows({ plan, setupConfig, capacity, revenue }));
    assert.equal(price.value, "600,00\u00a0₺ / görüşme");
    assert.equal(price.hint, "4 haftalık paket 2.400,00\u00a0₺ · komisyon sonrası eline 1.980,00\u00a0₺ geçer");
    assert.equal(price.chip, "600,00\u00a0₺");
    for (const text of [price.value, price.hint, price.chip]) {
      assert.doesNotMatch(text ?? "", /₺\s?\d/);
      assert.doesNotMatch(text ?? "", /\d ₺/, "the symbol must not be able to wrap");
    }
  });

  it("says free instead of printing a zero price, and drops the earnings hint", () => {
    const { price } = byStep(
      buildCoachingSettingRows({
        plan: { ...plan, price_per_session_minor: 0 },
        setupConfig,
        capacity,
        revenue,
      })
    );
    assert.equal(price.value, "Ücretsiz");
    assert.equal(price.hint, null);
    assert.equal(price.chip, "Ücretsiz");
  });

  it("falls back gracefully when the earnings preview has not loaded", () => {
    const { price } = byStep(buildCoachingSettingRows({ plan, setupConfig, capacity, revenue: null }));
    assert.equal(price.hint, null);
  });

  it("joins the exams and shows an unwritten description as such", () => {
    const rows = byStep(
      buildCoachingSettingRows({ plan: { ...plan, description: "   " }, setupConfig, capacity, revenue })
    );
    assert.equal(rows.exams.value, "YKS, DGS");
    assert.equal(rows.description.value, "Açıklama eklemedin");
    assert.equal(rows.description.chip, null);
  });

  it("names the weekly places and the days they fall on, once each, Monday first", () => {
    const { availability } = byStep(buildCoachingSettingRows({ plan, setupConfig, capacity, revenue }));
    assert.equal(availability.label, "Koçluk saatlerin");
    assert.equal(availability.value, "Haftada 12 görüşme yeri");
    assert.equal(availability.hint, "Pzt, Çar, Cum, Cmt");
    assert.equal(availability.chip, "12 görüşme yeri");
  });

  it("explains capacity against the current students and the ceiling the hours allow", () => {
    const { capacity: row } = byStep(buildCoachingSettingRows({ plan, setupConfig, capacity, revenue }));
    assert.equal(row.value, "En fazla 6 öğrenci");
    assert.equal(row.hint, "Şu an 3 kontenjan dolu · saatlerinle 8 öğrenciye kadar bakabilirsin");
    assert.equal(row.chip, "6 öğrenci");
  });

  it("copes with no capacity data at all", () => {
    const rows = byStep(buildCoachingSettingRows({ plan, setupConfig, capacity: null, revenue }));
    assert.equal(rows.availability.value, "Henüz eklenmedi");
    assert.equal(rows.availability.hint, null);
    assert.equal(rows.capacity.hint, null);
  });
});
