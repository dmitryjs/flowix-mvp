import { EllipsisVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconsLight, type LightIconName } from "@/ui-kit/icons-light";

export type TableProjectRowState = "default" | "hover" | "opened menu";

type TableProjectRowProps = {
  className?: string;
  state?: TableProjectRowState;
  projectName?: string;
  leadingIcon?: LightIconName;
  createdAtLabel?: string;
  screensLabel?: string;
  onOpenProject?: () => void;
  onOpenMenu?: () => void;
  onRename?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
};

export function TableProjectRow({
  className,
  state = "default",
  projectName = "Project name",
  leadingIcon = "folder",
  createdAtLabel = "Created 04.03.2026",
  screensLabel = "12 screens",
  onOpenProject,
  onOpenMenu,
  onRename,
  onShare,
  onDelete,
}: TableProjectRowProps) {
  const isHover = state === "hover";
  const isOpenedMenu = state === "opened menu";

  return (
    <article
      className={cn(
        "relative flex w-full items-center border-b border-[#e4e4e7] px-5 py-4",
        isHover ? "bg-[#eeeff0]" : "bg-white",
        className
      )}
      data-name="Table projects row"
      data-node-id={
        isHover ? "57:4368" : isOpenedMenu ? "57:4350" : "57:4339"
      }
    >
      <button
        type="button"
        onClick={onOpenProject}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <IconsLight icon={leadingIcon} className="h-5 w-5 shrink-0 text-[#8a8d94]" />
        <p className="truncate text-sm font-semibold leading-4 text-[#09090b]">
          {projectName}
        </p>
      </button>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-[29px] text-sm leading-4 text-[#09090b]">
          <p>{createdAtLabel}</p>
          <p>{screensLabel}</p>
        </div>

        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open project menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eeeff0] text-[#09090b] hover:bg-[#e4e5e7]"
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>
      </div>

      {isOpenedMenu && (
        <div className="absolute right-0 top-10 z-10 w-[214px] rounded-md border border-[#dbdcdd] bg-white p-1.5 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.09)]">
          <button
            type="button"
            onClick={onRename}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-[#09090b] hover:bg-[#eeeff0]"
          >
            <IconsLight icon="edit" className="h-4 w-4" />
            Change name
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-[#09090b] hover:bg-[#eeeff0]"
          >
            <IconsLight icon="share" className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-[#e31a24] hover:bg-[#eeeff0]"
          >
            <IconsLight icon="delete" className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
