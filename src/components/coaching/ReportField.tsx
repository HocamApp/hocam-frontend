"use client";

import { useId, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { REPORT_FIELD_RULES, reportCounter, type ReportFieldRule, type ReportTextField } from "@/lib/coachingReportDraft";

/**
 * One written part of the report: the label stays on screen (a placeholder
 * disappears with the first letter, and then two boxes cannot be told apart),
 * the example sits under it, and the counter says how far from the least the
 * server accepts. The counter turns red only after the field was left short,
 * never while the tutor is still typing.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function ReportField({
  label,
  hint,
  value,
  min,
  onChange,
  rows = 4,
}: {
  label: string;
  hint: string;
  value: string;
  min: number;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const id = useId();
  const [left, setLeft] = useState(false);
  const counter = reportCounter(value, min);
  const tone = counter.met ? "text-success" : left ? "text-error" : "text-ink-mid";

  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-ink">
        {label}
      </label>
      <p id={`${id}-hint`} className="mt-0.5 text-small text-ink-mid">
        {hint}
      </p>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setLeft(true)}
        aria-describedby={`${id}-hint ${id}-count`}
        className="mt-2 min-h-[7rem] bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <p id={`${id}-count`} className={`mt-1 text-right text-label tabular-nums ${tone}`}>
        {counter.text}
      </p>
    </div>
  );
}

/** The fields of one step, taken from the rules so the form and the checklist cannot drift apart. */
export function ReportFieldsStep({
  rules,
  values,
  onChange,
}: {
  rules: readonly ReportFieldRule[];
  values: Partial<Record<ReportTextField, string | undefined>>;
  onChange: (field: ReportTextField, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      {rules.map((rule) => (
        <ReportField
          key={rule.field}
          label={rule.label}
          hint={rule.hint}
          min={rule.min}
          value={values[rule.field] ?? ""}
          onChange={(value) => onChange(rule.field, value)}
        />
      ))}
    </div>
  );
}

export { REPORT_FIELD_RULES };
