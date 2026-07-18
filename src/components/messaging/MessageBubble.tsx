"use client";

import { useState } from "react";
import { Ban, Check, CheckCheck, ImageIcon, Reply, Trash2 } from "lucide-react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  /** Animate the bubble in — used for messages the user just sent. */
  isNew?: boolean;
  /** Show the timestamp row — true for the last bubble in a same-sender group. */
  showTime?: boolean;
  /** True when the previous bubble is from the same sender (tightens spacing). */
  groupedWithPrev?: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onJumpToReply?: (messageId: string) => void;
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
  showTime = true,
  groupedWithPrev = false,
  onReply,
  onDelete,
  onJumpToReply,
}: MessageBubbleProps) {
  const isDeleted = message.is_deleted;
  const reply = message.reply_to ?? null;
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "group flex w-full min-w-0 scroll-mt-20 items-center gap-1",
        groupedWithPrev ? "mt-0.5" : "mt-2",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* Actions (own message: left of bubble) */}
      {isOwnMessage && !isDeleted && (
        <BubbleActions
          message={message}
          canDelete
          onReply={onReply}
          onDelete={onDelete}
        />
      )}

      <div
        className={cn(
          "min-w-0 max-w-[78%] overflow-hidden rounded-2xl px-4 py-2 shadow-sm sm:max-w-[70%]",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm",
          isNew && "motion-safe:animate-message-pop"
        )}
      >
        {isDeleted ? (
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm italic",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            <Ban className="h-3.5 w-3.5 shrink-0" />
            Bu mesaj silindi
          </p>
        ) : (
          <>
            {reply && (
              <button
                type="button"
                onClick={() => onJumpToReply?.(reply.id)}
                className={cn(
                  "mb-1.5 flex w-full min-w-0 items-center gap-1.5 rounded-md border-l-2 px-2 py-1 text-left text-xs",
                  isOwnMessage
                    ? "border-primary-foreground/60 bg-primary-foreground/10 text-primary-foreground/80"
                    : "border-primary/60 bg-background/60 text-muted-foreground"
                )}
              >
                {reply.is_image && <ImageIcon className="h-3 w-3 shrink-0" />}
                <span className="truncate [overflow-wrap:anywhere]">
                  {reply.preview || (reply.is_image ? "Görsel" : "Mesaj")}
                </span>
              </button>
            )}
            {message.image_url && (
              <>
                <button
                  type="button"
                  onClick={() => setIsImagePreviewOpen(true)}
                  className="mb-2 block overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Görseli büyüt"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.image_url}
                    alt="Görsel ek"
                    className="max-w-full rounded-lg object-cover transition-transform duration-200 hover:scale-[1.01]"
                    style={{ maxHeight: 220 }}
                  />
                </button>
                <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
                  <DialogContent className="max-w-3xl border-none bg-transparent p-2 shadow-none">
                    <DialogTitle className="sr-only">Mesaj görseli</DialogTitle>
                    <div className="overflow-hidden rounded-lg bg-background p-1 shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={message.image_url}
                        alt="Mesaj görseli"
                        className="max-h-[80vh] w-full object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {message.message_text && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
                {message.message_text}
              </p>
            )}
            {showTime && (
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-xs opacity-70",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}
              >
                {formatMessageTime(message.created_at)}
                {isOwnMessage &&
                  (message.read_at ? (
                    <CheckCheck className="h-3.5 w-3.5" aria-label="Okundu" />
                  ) : (
                    <Check className="h-3.5 w-3.5" aria-label="Gönderildi" />
                  ))}
              </p>
            )}
          </>
        )}
      </div>

      {/* Actions (other participant: right of bubble) */}
      {!isOwnMessage && !isDeleted && (
        <BubbleActions message={message} onReply={onReply} />
      )}
    </div>
  );
}

function BubbleActions({
  message,
  canDelete = false,
  onReply,
  onDelete,
}: {
  message: Message;
  canDelete?: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (message: Message) => void;
}) {
  if (!onReply && !(canDelete && onDelete)) return null;
  return (
    <div className="touch-visible flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
      {onReply && (
        <button
          type="button"
          onClick={() => onReply(message)}
          aria-label="Yanıtla"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Reply className="h-4 w-4" />
        </button>
      )}
      {canDelete && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(message)}
          aria-label="Sil"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
