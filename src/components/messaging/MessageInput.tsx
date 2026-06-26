"use client";

import { useState, useRef, useEffect } from "react";
import { ImageIcon, Send, X } from "lucide-react";
import { Message } from "@/types";
import { sendMessage } from "@/lib/messagingApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SymbolPicker } from "@/components/messaging/SymbolPicker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  onMessageSent,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearImage = () => {
    setImage(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Sadece JPEG, PNG veya WebP görsel gönderebilirsiniz.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Görsel 5 MB veya daha küçük olmalı.");
      e.target.value = "";
      return;
    }
    setImage(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !image) || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        message_text: trimmed,
        image: image ?? undefined,
      });
      setText("");
      clearImage();
      onMessageSent(newMessage);
    } catch {
      toast.error("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
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

  // Release the preview object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const canSend = (!!text.trim() || !!image) && !isSubmitting && !disabled;

  return (
    <div className="flex flex-col gap-2 border-t bg-background p-4">
      {imagePreview && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Seçilen görsel önizlemesi"
            className="max-h-32 rounded-lg border object-contain"
          />
          <button
            type="button"
            onClick={clearImage}
            disabled={isSubmitting}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow"
            aria-label="Görseli kaldır"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Mesajınızı yazın..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSubmitting || disabled}
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none overflow-y-auto"
          )}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleImageSelected}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting || disabled}
          className="h-10 w-10 shrink-0"
        >
          <ImageIcon className="h-4 w-4" />
          <span className="sr-only">Fotoğraf ekle</span>
        </Button>
        <SymbolPicker
          onSelect={insertSymbol}
          disabled={isSubmitting || disabled}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={!canSend}
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
