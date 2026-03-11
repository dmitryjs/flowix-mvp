import * as React from "react";
import { CopyIcon, ExpandIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { ClickArea } from "@/ui-kit/click-area";
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
  fullScreenLabel?: string;
  onEdit?: () => void;
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
  fullScreenLabel = "Full screen",
  onEdit,
  onDelete,
  onCopy,
  onFullScreen,
}: FlowCardProps) {
  const showOverlay = state === "overlay" || state === "hover";
  const showHoverActions = state === "hover";

  return (
    <article
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-2xl bg-[#eeeff0] px-3 py-4",
        className
      )}
    >
      <header className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold leading-4 text-[#09090b]">{title}</h3>
          <button
            type="button"
            aria-label="Edit flow step"
            onClick={onEdit}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Delete flow step"
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#09090b] hover:bg-[#dfe2e6]"
        >
          <Trash2Icon className="h-4 w-4" />
        </button>
      </header>

      <div className="relative h-[471px] w-full overflow-hidden rounded-xl border border-[#dbdcdd]">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#71717a]">
            Screenshot unavailable
          </div>
        )}

        {showOverlay && <div className="absolute inset-0 bg-black/40" />}
        {clickPoint ? <ClickArea x={clickPoint.x} y={clickPoint.y} /> : null}

        {showHoverActions && (
          <button
            type="button"
            onClick={onFullScreen}
            className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-lg bg-[#eeeff0] pl-2 pr-3 py-1.5 text-xs font-medium text-[#09090b]"
          >
            <ExpandIcon className="h-[18px] w-[18px]" />
            {fullScreenLabel}
          </button>
        )}
      </div>

      <footer className="flex items-center gap-3">
        <p className="truncate text-sm leading-4 text-[#09090b]">{url}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Copy flow link"
            onClick={onCopy}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <CopyIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Edit flow link"
            onClick={onEdit}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#09090b] hover:bg-[#dfe2e6]"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </article>
  );
}
