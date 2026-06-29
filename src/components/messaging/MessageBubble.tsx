"use client";

import { Message } from "@/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  /** Animate the bubble in — used for messages the user just sent. */
  isNew?: boolean;
}

function formatMessageTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  isOwnMessage,
  isNew = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm",
          isNew && "motion-safe:animate-message-pop"
        )}
      >
        {message.image_url && (
          <a
            href={message.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.image_url}
              alt="Görsel ek"
              className="max-w-full rounded-lg object-cover"
              style={{ maxHeight: 200 }}
            />
          </a>
        )}
        {message.message_text && (
          <p className="whitespace-pre-wrap text-sm">{message.message_text}</p>
        )}
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
