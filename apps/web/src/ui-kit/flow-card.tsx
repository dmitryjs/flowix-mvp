import * as React from "react";
import { Maximize2Icon } from "lucide-react";
import { ClickArea } from "@/ui-kit/click-area";
import { IconsFilled } from "@/ui-kit/icons-filled";
import { IconsLight } from "@/ui-kit/icons-light";
import { cn } from "@/lib/utils";

export type FlowCardState = "default" | "hover" | "overlay";

type FlowCardProps = {
  className?: string;
  state?: FlowCardState;
  title?: string;
  url?: string;
  imageSrc: string;
  imageAlt?: string;
  clickPoint?: { x: number; y: number } | null;
  onEdit?: () => void;
  onEditUrl?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onFullScreen?: () => void;
};

export function FlowCard({
  className,
  state = "default",
  title = "Step 1",
  url = "https://dribbble.com/",
  imageSrc,
  imageAlt = "Flow step screenshot",
  clickPoint = null,
  onEdit,
  onEditUrl,
  onDelete,
  onCopy,
  onFullScreen,
}: FlowCardProps) {
  const isOverlay = state === "overlay";
  const isHover = state === "hover";

  return (
    <article
      className={cn("flex w-full flex-col gap-2.5 rounded-2xl bg-[#eeeff0] px-3 py-4", className)}
      data-name="Flow card"
      data-node-id={isOverlay ? "91:3855" : isHover ? "91:3870" : "91:3840"}
    >
      <header className={cn("flex items-center justify-between", !isHover && "px-1")}>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold leading-4 text-[#09090b]">{title}</h3>
          <button
            type="button"
            aria-label="Edit flow step"
            onClick={onEdit}
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <IconsFilled icon="edit" className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Full screen"
            onClick={onFullScreen}
            className="inline-flex h-[30px] w-8 items-center justify-center rounded-lg text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <Maximize2Icon className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Delete flow step"
            onClick={onDelete}
            className="inline-flex h-[30px] w-8 items-center justify-center rounded-lg text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <IconsLight icon="delete" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <div className="relative h-[471px] w-full overflow-hidden rounded-xl border border-[#dbdcdd]">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#71717a]">
            Screenshot unavailable
          </div>
        )}

        {isOverlay && (
          <div className="absolute inset-0 rounded-xl bg-[rgba(0,0,0,0.3)]" />
        )}

        {clickPoint ? <ClickArea x={clickPoint.x} y={clickPoint.y} /> : null}
      </div>

      <footer className="flex items-center gap-3">
        <p className="truncate text-sm leading-4 text-[#09090b]">{url}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Copy URL"
            onClick={onCopy}
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <IconsFilled icon="copy" className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Edit URL"
            onClick={onEditUrl}
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <IconsFilled icon="edit" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </footer>
    </article>
  );
}
