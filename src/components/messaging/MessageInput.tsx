"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Message } from "@/types";
import { sendMessage } from "@/lib/messagingApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      const newMessage = await sendMessage({
        conversation_id: conversationId,
        message_text: trimmed,
      });
      setText("");
      onMessageSent(newMessage);
    } catch {
      toast.error("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="flex gap-2 border-t bg-background p-4">
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
      <Button
        type="button"
        size="icon"
        onClick={handleSubmit}
        disabled={!text.trim() || isSubmitting || disabled}
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
  );
}
