"use client";

import { useEffect, useState } from "react";
import {
  IdentificationBadge,
  IdentificationCard,
  SuitcaseRolling,
  Wallet,
  type Icon,
} from "@phosphor-icons/react";
import { SplitFlap } from "@/components/bs/SplitFlap";
import { useT } from "@/lib/i18n/provider";
import type { ChecklistTile } from "@/lib/trip/checklist";
import { cn } from "@/lib/utils";

const ICONS: Record<ChecklistTile["id"], Icon> = {
  visa: IdentificationCard,
  passport: IdentificationBadge,
  baggage: SuitcaseRolling,
  money: Wallet,
};

/** Compact tiles, as on the package screen. Statuses flap, without a tick. */
export function ChecklistTiles({ tiles }: { tiles: ChecklistTile[] }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map((tile) => {
        const attention = tile.warn || !tile.ok;
        const status = t(tile.statusKey, tile.statusValues);
        return (
          <div
            key={tile.id}
            className={cn("rounded-button px-3 py-2.5", attention ? "bg-orange-soft" : "bg-green-soft")}
          >
            <p className="text-xs text-muted">{t(tile.labelKey)}</p>
            {tile.plain ? (
              <p className="font-mono text-[13px] font-semibold text-orange">{status}</p>
            ) : (
              <p className={cn("font-mono text-[13px] font-semibold", attention ? "text-orange" : "text-green")}>
                <SplitFlap value={status} haptic={false} cellClassName="text-[13px]" />
              </p>
            )}
            {tile.hintKey && <p className="text-[11px] text-muted">{t(tile.hintKey)}</p>}
            {tile.source && (
              <a
                href={tile.source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-[11px] font-semibold text-blue underline"
              >
                {tile.source.title}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

const STAGGER_MS = 1300;

/**
 * Ready-to-go tiles. Each status flaps on its own, one `tick` apart, so the
 * one-vibration-per-second rule still lets every tile land.
 */
export function ChecklistBoard({ tiles }: { tiles: ChecklistTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tiles.map((tile, index) => (
        <BoardTile key={tile.id} tile={tile} index={index} />
      ))}
    </div>
  );
}

function BoardTile({ tile, index }: { tile: ChecklistTile; index: number }) {
  const t = useT();
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLanded(true), index * STAGGER_MS);
    return () => clearTimeout(timer);
  }, [index]);

  const attention = tile.warn || !tile.ok;
  const status = t(tile.statusKey, tile.statusValues);
  const Icon = ICONS[tile.id];
  const tone = attention ? "text-orange" : "text-green";

  return (
    <div className={cn("rounded-card p-3.5", attention ? "bg-orange-soft" : "bg-card shadow-soft")}>
      <span
        aria-hidden
        className={cn(
          "flex size-10 items-center justify-center rounded-pill",
          attention ? "bg-card" : "bg-green-soft",
        )}
      >
        <Icon size={20} weight="fill" className={tone} />
      </span>
      <p className="mt-2.5 text-[13px] text-muted">{t(tile.labelKey)}</p>
      <p className={cn("mt-0.5 font-mono text-[15px] font-semibold leading-tight", tone)}>
        {landed ? (
          <SplitFlap value={status} cellClassName="text-[15px]" />
        ) : (
          <span className="invisible">{status}</span>
        )}
      </p>
      {tile.hintKey && <p className="mt-1 text-xs text-muted">{t(tile.hintKey)}</p>}
      {tile.detailKey && (
        <p className={cn("mt-1 text-xs", attention ? "font-semibold text-orange" : "text-muted")}>
          {t(tile.detailKey, tile.detailValues)}
        </p>
      )}
      {tile.source && (
        <a
          href={tile.source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-blue underline"
        >
          {tile.source.title}
        </a>
      )}
    </div>
  );
}

/** When the last tile has had time to tick, and the next haptic is free. */
export function boardLandedDelay(count: number): number {
  return Math.max(0, count - 1) * STAGGER_MS + 900 + 1100;
}
