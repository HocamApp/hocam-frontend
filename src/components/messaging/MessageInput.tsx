"use client";

import { useState, useRef, useEffect } from "react";
import { AxiosError } from "axios";
import { ImageIcon, Reply, Send, X } from "lucide-react";
import { Message } from "@/types";
import { sendMessage } from "@/lib/messagingApi";
import { formatImageSize, prepareMessageImage } from "@/lib/messageImage";
import { playSendSound } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SymbolPicker } from "@/components/messaging/SymbolPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
  disabled?: boolean;
  replyTo?: Message | null;
  replyToName?: string;
  onCancelReply?: () => void;
}

export function MessageInput({
  conversationId,
  onMessageSent,
  disabled = false,
  replyTo = null,
  replyToName,
  onCancelReply,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      toast.error(
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

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || isSubmitting || isPreparingImage || disabled) return;

    setIsSubmitting(true);
    try {
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        message_text: trimmed || undefined,
        image: selectedImage ?? undefined,
        reply_to: replyTo?.id,
      });
      setText("");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedImage(null);
      setPreviewUrl(null);
      onCancelReply?.();
      onMessageSent(newMessage);
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
      toast.error(
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
      <div className="flex min-w-0 items-end gap-2 p-3 sm:p-4">
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleImageSelect}
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
        <Textarea
          ref={textareaRef}
          placeholder="Mesajınızı yazın..."
          value={text}
          onChange={(e) => setText(e.target.value)}
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
            (!text.trim() && !selectedImage) ||
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
    </div>
  );
}
