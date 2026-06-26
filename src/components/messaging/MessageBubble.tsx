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
        {message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.attachment_url}
              alt="Mesaj eki"
              className="max-h-64 max-w-full rounded-lg object-contain"
            />
          </a>
        )}
        {message.message_text && (
          <p
            className={cn(
              "whitespace-pre-wrap text-sm",
              message.attachment_url && "mt-2"
            )}
          >
            {message.message_text}
          </p>
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
