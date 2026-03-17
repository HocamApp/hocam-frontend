"use client";

import { Message } from "@/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

function formatMessageTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.message_text}</p>
        <p
          className={cn(
            "mt-1 text-xs opacity-70",
            isOwnMessage ? "text-right" : "text-left"
          )}
        >
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
