"use client";

import { useState, useRef, useEffect } from "react";
import { AxiosError } from "axios";
import { ImageIcon, Paperclip, Reply, Send, X } from "lucide-react";
import { Message } from "@/types";
import { sendMessage } from "@/lib/messagingApi";
import { formatImageSize, prepareMessageImage } from "@/lib/messageImage";
import { playSendSound } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SymbolPicker } from "@/components/messaging/SymbolPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SensitiveDataGuidance } from "@/components/privacy/SensitiveDataGuidance";

const MESSAGE_GUIDANCE_SEEN_KEY = "hocam_sensitive_data_guidance_seen";

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
  disabled?: boolean;
  replyTo?: Message | null;
  replyToName?: string;
  onCancelReply?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function MessageInput({
  conversationId,
  onMessageSent,
  disabled = false,
  replyTo = null,
  replyToName,
  onCancelReply,
  onTypingChange,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPrivacyGuidance, setShowPrivacyGuidance] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setShowPrivacyGuidance(localStorage.getItem(MESSAGE_GUIDANCE_SEEN_KEY) !== "true");
    } catch {
      setShowPrivacyGuidance(true);
    }
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInputError(null);
    setIsPreparingImage(true);
    try {
      const prepared = await prepareMessageImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedImage(prepared.file);
      setPreviewUrl(URL.createObjectURL(prepared.file));
      if (prepared.compressed) {
        toast.success(
          `Görsel hız için optimize edildi (${formatImageSize(
            prepared.originalSize
          )} → ${formatImageSize(prepared.file.size)}).`
        );
      }
    } catch (err) {
      setInputError(
        err instanceof Error
          ? err.message
          : "Görsel hazırlanamadı. Lütfen tekrar deneyin."
      );
    } finally {
      setIsPreparingImage(false);
      e.target.value = "";
    }
  };

  const focusTextarea = () => {
    if (disabled) return;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl(null);
    focusTextarea();
  };

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setInputError("Ek 25 MB veya daha küçük olmalı.");
      return;
    }
    setSelectedAttachment(file);
    setInputError(null);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage && !selectedAttachment) || isSubmitting || isPreparingImage || disabled) return;

    setInputError(null);
    setIsSubmitting(true);
    try {
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        message_text: trimmed || undefined,
        image: selectedImage ?? undefined,
        attachment: selectedAttachment ?? undefined,
        attachment_kind: selectedAttachment
          ? selectedAttachment.type.startsWith("image/")
            ? "image"
            : "file"
          : undefined,
        reply_to: replyTo?.id,
      });
      setText("");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedImage(null);
      setSelectedAttachment(null);
      setPreviewUrl(null);
      onCancelReply?.();
      onMessageSent(newMessage);
      if (showPrivacyGuidance) {
        try {
          localStorage.setItem(MESSAGE_GUIDANCE_SEEN_KEY, "true");
        } catch {}
        setShowPrivacyGuidance(false);
      }
      // Success-only feedback — never plays on a failed send.
      playSendSound();
    } catch (err) {
      const data = (err as AxiosError<Record<string, unknown>>)?.response?.data;
      const imageError = Array.isArray(data?.image)
        ? (data?.image[0] as string)
        : undefined;
      const messageTextError = Array.isArray(data?.message_text)
        ? (data?.message_text[0] as string)
        : undefined;
      const nonFieldError = Array.isArray(data?.non_field_errors)
        ? (data?.non_field_errors[0] as string)
        : undefined;
      setInputError(
        imageError ||
          messageTextError ||
          nonFieldError ||
          "Mesaj gönderilemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setIsSubmitting(false);
      focusTextarea();
    }
  };

  const insertSymbol = (symbol: string) => {
    setText((prev) => prev + symbol);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-grow textarea (keep between 1 and ~6 lines, max 120px)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  useEffect(() => {
    onTypingChange?.(text.trim().length > 0);
  }, [onTypingChange, text]);

  useEffect(() => {
    return () => {
      onTypingChange?.(false);
    };
  }, [onTypingChange]);

  return (
    <div className="border-t bg-background">
      {replyTo && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border-l-2 border-primary/60 bg-muted/60 px-3 py-1.5">
            <Reply className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">
                {replyToName ? `${replyToName} kişisine yanıt` : "Yanıtlanıyor"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {replyTo.is_deleted
                  ? "Bu mesaj silindi"
                  : replyTo.message_text || (replyTo.image_url ? "Görsel" : "Mesaj")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Yanıtı iptal et"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {previewUrl && (
        <div className="flex items-start gap-2 px-4 pt-3">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Görsel önizleme"
              className="h-20 w-20 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background"
              aria-label="Görseli kaldır"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
      {isPreparingImage && (
        <div className="px-4 pt-3 text-xs text-muted-foreground">
          Görsel gönderim için hazırlanıyor...
        </div>
      )}
      {inputError && (
        <div className="px-4 pt-3 text-xs text-destructive" role="alert">
          {inputError}
        </div>
      )}
      {showPrivacyGuidance && <SensitiveDataGuidance className="px-4 pt-3" />}
      <div className="flex min-w-0 items-end gap-2 p-3 sm:p-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          hidden
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          hidden
          onChange={handleAttachmentSelect}
          id={`attachment-${conversationId}`}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting || isPreparingImage || disabled}
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Görsel ekle"
        >
          {isPreparingImage ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => document.getElementById(`attachment-${conversationId}`)?.click()} disabled={isSubmitting || disabled} aria-label="Dosya ekle">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          placeholder="Mesajınızı yazın..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setInputError(null);
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSubmitting || disabled}
          className={cn(
            "min-h-[40px] min-w-0 max-h-[120px] resize-none overflow-y-auto break-words [overflow-wrap:anywhere]"
          )}
        />
        <SymbolPicker
          onSelect={insertSymbol}
          disabled={isSubmitting || isPreparingImage || disabled}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={
            (!text.trim() && !selectedImage && !selectedAttachment) ||
            isSubmitting ||
            isPreparingImage ||
            disabled
          }
          className="h-10 w-10 shrink-0"
        >
          {isSubmitting ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
              aria-hidden
            />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">Gönder</span>
        </Button>
      </div>
      {selectedAttachment && (
        <div className="flex items-center gap-2 px-4 pb-3 text-xs text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          <span className="truncate">{selectedAttachment.name}</span>
          <button type="button" onClick={() => setSelectedAttachment(null)} className="underline">Kaldır</button>
        </div>
      )}
    </div>
  );
}
