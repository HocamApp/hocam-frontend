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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Yalnızca görsel dosyaları (JPEG, PNG, GIF, WebP) gönderilebilir.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Görsel 5 MB'dan küçük olmalıdır.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && !selectedImage) || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        message_text: trimmed || undefined,
        image: selectedImage ?? undefined,
      });
      setText("");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedImage(null);
      setPreviewUrl(null);
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

  return (
    <div className="border-t bg-background">
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
      <div className="flex gap-2 p-4">
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
          disabled={isSubmitting || disabled}
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Görsel ekle"
        >
          <ImageIcon className="h-4 w-4" />
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
            "min-h-[40px] max-h-[120px] resize-none overflow-y-auto"
          )}
        />
        <SymbolPicker
          onSelect={insertSymbol}
          disabled={isSubmitting || disabled}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={(!text.trim() && !selectedImage) || isSubmitting || disabled}
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
