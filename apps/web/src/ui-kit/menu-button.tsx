import { EllipsisVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItem } from "@/ui-kit/menu-item";
import type { LightIconName } from "@/ui-kit/icons-light";

export type MenuButtonState = "Default" | "hover" | "active";

type MenuButtonItem = {
  label: string;
  iconLeft?: boolean;
  iconRight?: boolean;
  leftIconName?: LightIconName | null;
  rightIconName?: LightIconName | null;
  destructive?: boolean;
  onClick?: () => void;
};

type MenuButtonProps = {
  className?: string;
  state?: MenuButtonState;
  items?: MenuButtonItem[];
  onClick?: () => void;
};

const DEFAULT_ITEMS: MenuButtonItem[] = [
  { label: "Item menu" },
  { label: "Item menu" },
  { label: "Item menu" },
  { label: "Item menu" },
];

export function MenuButton({
  className,
  state = "Default",
  items = DEFAULT_ITEMS,
  onClick,
}: MenuButtonProps) {
  const isActive = state === "active";
  const isHover = state === "hover";

  return (
    <div
      className={cn(
        "relative inline-flex w-8 flex-col items-center justify-center rounded-lg px-3 py-1.5",
        isHover ? "bg-[#c3c6ca]" : "bg-[#eeeff0]",
        className
      )}
      data-name="Menu Button"
      data-node-id={isHover ? "57:4422" : isActive ? "57:4418" : "57:4415"}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label="Open menu"
        className="inline-flex h-5 w-5 items-center justify-center text-[#09090b]"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isActive ? (
        <div className="absolute right-0 top-10 z-10 flex w-[214px] flex-col items-start rounded-md border border-[#dbdcdd] bg-white p-1.5 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.09)]">
          {items.map((item, index) => (
            <MenuItem
              key={`${item.label}-${index}`}
              label={item.label}
              iconLeft={item.iconLeft ?? true}
              iconRight={item.iconRight ?? true}
              leftIconName={item.leftIconName ?? "settings"}
              rightIconName={item.rightIconName ?? "settings"}
              destructive={item.destructive}
              onClick={item.onClick}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
