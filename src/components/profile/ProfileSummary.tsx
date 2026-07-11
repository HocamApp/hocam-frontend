"use client";

import { ReactNode, useState } from "react";
import { Mail, UserCog } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileSummaryProps {
  fullName: string;
  name: string;
  surname: string;
  role: "student" | "tutor" | undefined;
  email: string | undefined;
  avatarImage: string;
  initials: string;
  studentMeta?: {
    targetExamType?: string;
    school?: string;
    grade?: string;
  };
  onSave: (name: string, surname: string) => Promise<void>;
  avatarEditor: ReactNode;
}

export function ProfileSummary({
  fullName,
  name,
  surname,
  role,
  email,
  avatarImage,
  initials,
  studentMeta,
  onSave,
  avatarEditor,
}: ProfileSummaryProps) {
  const [nameEdit, setNameEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSurname, setEditSurname] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  const startNameEdit = () => {
    setEditName(name);
    setEditSurname(surname);
    setNameError(null);
    setNameEdit(true);
  };

  const handleSave = async () => {
    const trimmedName = editName.trim();
    const trimmedSurname = editSurname.trim();
    if (!trimmedName || !trimmedSurname) {
      setNameError("İsim ve soyisim boş olamaz.");
      return;
    }
    setNameSaving(true);
    try {
      await onSave(trimmedName, trimmedSurname);
      setNameEdit(false);
    } catch {
      setNameError("İsim güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setNameSaving(false);
    }
  };

  const metaLine = studentMeta
    ? [studentMeta.targetExamType, studentMeta.school, studentMeta.grade]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar className="h-16 w-16 shrink-0 border border-border">
          {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials || <UserCog className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          {nameEdit ? (
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder="İsim"
                  aria-label="İsim"
                />
                <Input
                  value={editSurname}
                  onChange={(e) => {
                    setEditSurname(e.target.value);
                    setNameError(null);
                  }}
                  placeholder="Soyisim"
                  aria-label="Soyisim"
                />
              </div>
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={nameSaving}>
                  Kaydet
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNameEdit(false)}
                  disabled={nameSaving}
                >
                  Vazgeç
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="truncate text-xl font-semibold text-foreground">
                {fullName || "İsimsiz kullanıcı"}
              </p>
              <Badge variant="secondary">{role === "tutor" ? "Eğitmen" : "Öğrenci"}</Badge>
            </div>
          )}
          {!nameEdit && (
            <>
              {metaLine && <p className="text-sm text-muted-foreground">{metaLine}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{email}</span>
                </p>
                <Button size="sm" variant="outline" onClick={startNameEdit}>
                  Profili düzenle
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      {avatarEditor}
    </div>
  );
}
