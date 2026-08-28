"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { DeletionIssue } from "@/lib/authApi";

interface IssueAction {
  label: string;
  href: string;
}

/**
 * Where each precheck issue can be resolved. Codes come from the backend
 * deletion precheck contract; unknown codes render their message only.
 */
const ISSUE_ACTIONS: Record<string, IssueAction[]> = {
  upcoming_lessons: [
    { label: "Derslerinizi görüntüleyin", href: "/profile/lessons/upcoming" },
  ],
  unused_credits: [
    { label: "Ders planla", href: "/tutors" },
    { label: "İade talebi oluştur", href: "/profile/payments" },
  ],
  open_refund: [{ label: "Süreci görüntüle", href: "/profile/payments" }],
  open_dispute: [{ label: "Süreci görüntüle", href: "/profile/payments" }],
  active_subscription: [
    { label: "Aboneliği görüntüle", href: "/profile/payments" },
  ],
};

function IssueActions({ code }: { code: string }) {
  const actions = ISSUE_ACTIONS[code] ?? [];
  if (actions.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {action.label}
          <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

interface DeletionOptionsListProps {
  blockers: DeletionIssue[];
  warnings: DeletionIssue[];
  onContinue: () => void;
  continuing?: boolean;
}

/**
 * Step 1 of the account deletion flow: blockers must be resolved before the
 * account can be deleted (destructive alert, no way forward); warnings can be
 * acknowledged with "Yine de devam et".
 */
export function DeletionOptionsList({
  blockers,
  warnings,
  onContinue,
  continuing = false,
}: DeletionOptionsListProps) {
  return (
    <div className="space-y-4">
      {blockers.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Bunlar çözülmeden hesap silinemez.</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-3">
              {blockers.map((issue) => (
                <li key={issue.code}>
                  <p>{issue.message}</p>
                  <IssueActions code={issue.code} />
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <div className="rounded-[var(--radius-input)] border border-[var(--gold-ink)]/20 bg-[var(--gold)] p-4 text-[var(--gold-ink)]">
          <div className="flex items-start gap-2 text-sm font-medium text-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Devam etmeden önce gözden geçirin:
          </div>
          <ul className="mt-3 space-y-3 text-sm text-[var(--gold-ink)]/80">
            {warnings.map((issue) => (
              <li key={issue.code}>
                <p>{issue.message}</p>
                <IssueActions code={issue.code} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {blockers.length === 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={onContinue}
          disabled={continuing}
        >
          Yine de devam et
        </Button>
      )}
    </div>
  );
}
