"use client";

import { RefObject } from "react";
import { Camera } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PROFILE_PHOTO_ACCEPT,
  PROFILE_PHOTO_RULE_TEXT,
  TUTOR_REAL_PHOTO_RULE_TEXT,
} from "@/lib/profilePhoto";
import { STUDENT_AVATAR_PRESETS, type StudentAvatarKey } from "@/lib/studentAvatars";

interface AvatarEditorProps {
  avatarImage: string;
  initials: string;
  fullName: string;
  isStudent: boolean;
  isTutor: boolean;
  photoUploading: boolean;
  photoError: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  onPickFile: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  studentAvatar?: {
    avatarKind?: string | null;
    avatarKey?: string | null;
  };
  avatarChoicePendingKey: StudentAvatarKey | null;
  onChooseStudentAvatar: (key: StudentAvatarKey) => void;
}

export function AvatarEditor({
  avatarImage,
  initials,
  fullName,
  isStudent,
  isTutor,
  photoUploading,
  photoError,
  fileInputRef,
  onPickFile,
  onFileChange,
  studentAvatar,
  avatarChoicePendingKey,
  onChooseStudentAvatar,
}: AvatarEditorProps) {
  if (!isStudent && !isTutor) return null;

  const busy = photoUploading || Boolean(avatarChoicePendingKey);
  const noticeText = isTutor
    ? [PROFILE_PHOTO_RULE_TEXT, TUTOR_REAL_PHOTO_RULE_TEXT]
    : [PROFILE_PHOTO_RULE_TEXT];

  return (
    <div>
      <input
        type="file"
        accept={PROFILE_PHOTO_ACCEPT}
        hidden
        ref={fileInputRef}
        onChange={onFileChange}
      />
      <Accordion type="single" collapsible>
        <AccordionItem value="avatar-editor" className="border-none">
          <AccordionTrigger className="gap-2 rounded-md py-2 text-sm font-medium text-foreground hover:no-underline">
            <span className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-border">
                {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              Fotoğrafı değiştir
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 rounded-md border border-border bg-muted/20 p-3">
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-xs transition-colors",
                  photoError
                    ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
                    : "border-border bg-transparent text-muted-foreground"
                )}
              >
                {noticeText.map((line) => (
                  <p key={line} className="mt-1 first:mt-0">
                    {line}
                  </p>
                ))}
              </div>
              {photoError && (
                <p className="text-sm text-destructive" role="alert">
                  {photoError}
                </p>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onPickFile}
                disabled={busy}
              >
                {photoUploading ? (
                  <span
                    className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden
                  />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                {photoUploading ? "Yükleniyor" : "Fotoğraf yükle"}
              </Button>
              {isStudent && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Hazır avatar seç</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {STUDENT_AVATAR_PRESETS.map((preset) => {
                      const selected =
                        studentAvatar?.avatarKind === "anonymous" &&
                        studentAvatar?.avatarKey === preset.key;
                      const pending = avatarChoicePendingKey === preset.key;

                      return (
                        <button
                          key={preset.key}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => onChooseStudentAvatar(preset.key)}
                          disabled={busy}
                          className={cn(
                            "flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-md border bg-background px-2 py-2 text-xs font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60",
                            selected && "border-primary bg-primary/10 text-primary"
                          )}
                        >
                          <Avatar className="h-12 w-12 border border-border bg-muted">
                            <AvatarImage src={preset.url} alt={preset.label} />
                            <AvatarFallback>{preset.label.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <span className="leading-none">
                            {pending ? "Seçiliyor" : preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
