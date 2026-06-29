"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupportTicket } from "@/lib/supportApi";
import type { SupportTicketCategory } from "@/types/api";
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from "./supportContent";

export function SupportTicketForm() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<SupportTicketCategory | "">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{
    category?: string;
    subject?: string;
    message?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      toast.success("Destek talebiniz alındı. Destek ekibi en kısa sürede inceleyecek.");
      setCategory("");
      setSubject("");
      setMessage("");
      setErrors({});
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) => {
      const data = (err as AxiosError<Record<string, string[]>>)?.response?.data;
      const firstError =
        data?.subject?.[0] || data?.message?.[0] || data?.category?.[0];
      toast.error(
        firstError || "Talebiniz gönderilemedi. Lütfen tekrar deneyin."
      );
    },
  });

  const validate = () => {
    const next: typeof errors = {};
    if (!category) next.category = "Lütfen bir kategori seçin.";
    if (subject.trim().length < 3)
      next.subject = "Konu en az 3 karakter olmalıdır.";
    if (message.trim().length < 10)
      next.message = "Mesaj en az 10 karakter olmalıdır.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || mutation.isPending) return;
    mutation.mutate({
      category: category as SupportTicketCategory,
      subject: subject.trim(),
      message: message.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="support-category">Kategori</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as SupportTicketCategory)}
        >
          <SelectTrigger id="support-category" aria-invalid={!!errors.category}>
            <SelectValue placeholder="Kategori seçin" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-subject">Konu</Label>
        <Input
          id="support-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Talebinizi kısaca özetleyin"
          maxLength={255}
          aria-invalid={!!errors.subject}
        />
        {errors.subject && (
          <p className="text-xs text-destructive">{errors.subject}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="support-message">Mesaj</Label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Yaşadığınız durumu mümkün olduğunca açık şekilde anlatın."
          rows={5}
          maxLength={5000}
          aria-invalid={!!errors.message}
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message}</p>
        )}
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
        {mutation.isPending ? (
          <span
            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
            aria-hidden
          />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Talebi gönder
      </Button>
    </form>
  );
}
