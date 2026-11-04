"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DeviceMobile, Export, PlusSquare } from "@phosphor-icons/react";
import { Sheet } from "@/components/bs/Sheet";
import { haptic } from "@/lib/haptics";
import { useT } from "@/lib/i18n/provider";
import { promptInstall, readInstallMode, readServerInstallMode, subscribeInstall } from "@/lib/pwa/install";
import { cn } from "@/lib/utils";

/**
 * "Install BonSafar". Android Chrome: the browser's own dialog. iPhone: a short
 * sheet, Share then Add to Home Screen. Hidden once installed or when neither works.
 */
export function InstallButton({ className, onDone }: { className?: string; onDone?: () => void }) {
  const t = useT();
  const mode = useSyncExternalStore(subscribeInstall, readInstallMode, readServerInstallMode);
  const [iosOpen, setIosOpen] = useState(false);
  if (mode === "hidden" && !iosOpen) return null;

  const root = iosOpen && typeof document !== "undefined" ? document.querySelector<HTMLElement>("[data-phone-root]") : null;
  const sheet = (
    <Sheet open={iosOpen} onClose={() => setIosOpen(false)} title={t("install.iosTitle")}>
      <ol className="mt-4 flex flex-col gap-3">
        <li className="flex items-center gap-3.5 rounded-button bg-bg px-4 py-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card">
            <Export size={22} weight="light" className="text-blue" aria-hidden />
          </span>
          <span className="text-[15px]">{t("install.iosStep1")}</span>
        </li>
        <li className="flex items-center gap-3.5 rounded-button bg-bg px-4 py-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card">
            <PlusSquare size={22} weight="light" className="text-ink" aria-hidden />
          </span>
          <span className="text-[15px]">{t("install.iosStep2")}</span>
        </li>
      </ol>
    </Sheet>
  );

  return (
    <>
      {mode !== "hidden" && (
        <button
          type="button"
          onClick={async () => {
            haptic("tap");
            if (mode === "prompt") {
              await promptInstall();
              onDone?.();
            } else {
              setIosOpen(true);
            }
          }}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-button border border-line bg-card text-[15px] font-semibold text-ink",
            className,
          )}
        >
          <DeviceMobile size={20} weight="light" aria-hidden />
          {t("install.button")}
        </button>
      )}
      {root ? createPortal(sheet, root) : null}
    </>
  );
}
