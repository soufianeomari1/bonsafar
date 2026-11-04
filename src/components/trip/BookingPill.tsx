"use client";

import { CheckCircle, Clock, WarningCircle } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n/provider";
import type { BookingStatus } from "@/lib/trip/saved";
import { cn } from "@/lib/utils";

const LOOK: Record<BookingStatus | "ready", { className: string; icon: typeof Clock }> = {
  booked: { className: "bg-green-soft text-green", icon: CheckCircle },
  to_confirm: { className: "bg-orange-soft text-orange", icon: Clock },
  issue: { className: "bg-red-soft text-red", icon: WarningCircle },
  ready: { className: "bg-fill text-ink", icon: Clock },
};

/** Booking status of a saved trip, in plain words. */
export function BookingPill({ status, className }: { status: BookingStatus | null | undefined; className?: string }) {
  const t = useT();
  const key = status ?? "ready";
  const { className: tone, icon: StatusIcon } = LOOK[key];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 text-[11.5px] font-semibold", tone, className)}>
      <StatusIcon size={13} aria-hidden />
      {t(`status.${key}`)}
    </span>
  );
}
