"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageRequest } from "@/types";
import {
  acceptMessageRequest,
  blockMessageRequest,
  fetchMessageRequests,
  rejectMessageRequest,
} from "@/lib/messagingApi";
import { formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

const STATUS_LABELS: Record<MessageRequest["status"], string> = {
  pending: "Bekliyor",
  accepted: "Kabul edildi",
  rejected: "Reddedildi",
  blocked: "Engellendi",
};

const STATUS_BADGE_VARIANTS: Record<
  MessageRequest["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  accepted: "default",
  rejected: "outline",
  blocked: "destructive",
};

function actionErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string" && detail) return detail;
  }
  return "İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.";
}

function RequestSkeletonRow() {
  return (
    <div className="space-y-2 border-b p-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

function MessageRequestRow({
  request,
  onAccept,
  onReject,
  onBlockRequested,
  isActing,
}: {
  request: MessageRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onBlockRequested: (request: MessageRequest) => void;
  isActing: boolean;
}) {
  const isPending = request.status === "pending";

  return (
    <div className="space-y-2 border-b p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {request.student.email}
        </p>
        <Badge variant={STATUS_BADGE_VARIANTS[request.status]} className="shrink-0">
          {STATUS_LABELS[request.status]}
        </Badge>
      </div>
      <p className="line-clamp-2 break-words text-xs text-muted-foreground">
        {request.message}
      </p>
      {request.created_at && (
        <p className="text-xs text-muted-foreground">
          {formatRelativeDate(request.created_at)}
        </p>
      )}
      {isPending && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={isActing}
            onClick={() => onAccept(request.id)}
          >
            Kabul Et
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isActing}
            onClick={() => onReject(request.id)}
          >
            Reddet
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isActing}
            onClick={() => onBlockRequested(request)}
          >
            Engelle
          </Button>
        </div>
      )}
      {request.status === "accepted" && request.conversation_id && (
        <div className="pt-1">
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/messages/${request.conversation_id}`}>Sohbete Git</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export function MessageRequestList() {
  const queryClient = useQueryClient();
  const [blockTarget, setBlockTarget] = useState<MessageRequest | null>(null);

  const {
    data: requests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["message-requests"],
    queryFn: fetchMessageRequests,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptMessageRequest,
    onSuccess: () => {
      toast.success("Mesaj isteği kabul edildi. Konuşma başlatıldı.");
      queryClient.invalidateQueries({ queryKey: ["message-requests"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) => toast.error(actionErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectMessageRequest,
    onSuccess: () => {
      toast.success("Mesaj isteği reddedildi.");
      queryClient.invalidateQueries({ queryKey: ["message-requests"] });
    },
    onError: (err) => toast.error(actionErrorMessage(err)),
  });

  const blockMutation = useMutation({
    mutationFn: blockMessageRequest,
    onSuccess: () => {
      toast.success("Öğrenci engellendi.");
      queryClient.invalidateQueries({ queryKey: ["message-requests"] });
    },
    onError: (err) => toast.error(actionErrorMessage(err)),
    onSettled: () => setBlockTarget(null),
  });

  const isActing =
    acceptMutation.isPending || rejectMutation.isPending || blockMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3].map((i) => (
          <RequestSkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage message="Mesaj istekleri yüklenemedi. Lütfen tekrar deneyin." />
      </div>
    );
  }

  if (!requests?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-medium">Henüz mesaj isteğin yok.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Öğrenciler sana ilk kez yazdığında burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {requests.map((request) => (
        <MessageRequestRow
          key={request.id}
          request={request}
          onAccept={(id) => acceptMutation.mutate(id)}
          onReject={(id) => rejectMutation.mutate(id)}
          onBlockRequested={setBlockTarget}
          isActing={isActing}
        />
      ))}
      <Dialog
        open={blockTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBlockTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Öğrenciyi engelle</DialogTitle>
            <DialogDescription>
              {blockTarget
                ? `${blockTarget.student.email} bir daha sana mesaj isteği gönderemeyecek. Bu işlem geri alınamaz.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBlockTarget(null)}
              disabled={blockMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={blockMutation.isPending}
              onClick={() => {
                if (blockTarget) blockMutation.mutate(blockTarget.id);
              }}
            >
              Engelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
