import * as React from "react";
import { cn } from "@/lib/utils";
import { IconsLight, type LightIconName } from "@/ui-kit/icons-light";
import { AvatarBase } from "@/ui-kit/avatar-base";

type MenuItemProps = {
  className?: string;
  state?: "Default" | "Hover" | "Disabled";
  itemType?: "Menu item" | "Person";
  label?: string;
  iconLeft?: boolean;
  iconRight?: boolean;
  leftIconName?: LightIconName | null;
  rightIconName?: LightIconName | null;
  destructive?: boolean;
  personName?: string;
  personEmail?: string;
  personInitials?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function MenuItem({
  className,
  state = "Default",
  itemType = "Menu item",
  label = "Item menu",
  iconLeft = true,
  iconRight = true,
  leftIconName = "settings",
  rightIconName = "settings",
  destructive = false,
  personName = "Dmitry Galkin",
  personEmail = "example@gmail.com",
  personInitials = "CN",
  type = "button",
  ...props
}: MenuItemProps) {
  const isDisabled = state === "Disabled";
  const isHover = state === "Hover";
  const isPerson = itemType === "Person";

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        "flex w-[214px] items-center justify-center rounded-md text-left",
        isPerson ? "h-[60px] bg-white px-2 py-1.5" : "gap-2 bg-white px-2 py-1.5",
        isHover && !isDisabled && !isPerson ? "bg-[#eeeff0]" : "",
        isDisabled ? "cursor-not-allowed opacity-70" : "",
        className
      )}
      data-name="Menu item"
      data-node-id="57:4392"
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isPerson ? (
          <>
            <AvatarBase initials={personInitials} size="md" className="border-none bg-[#f4f4f5]" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium leading-5 text-[#09090b]">
                {personName}
              </span>
              <span className="truncate text-xs leading-5 text-[#71717a]">
                {personEmail}
              </span>
            </div>
          </>
        ) : (
          <>
            {iconLeft && leftIconName ? (
              <IconsLight
                icon={leftIconName}
                className={cn("h-4 w-4", isDisabled ? "text-[#8a8d94]" : "text-[#09090b]")}
              />
            ) : null}
            <span
              className={cn(
                "truncate text-sm font-medium leading-5",
                isDisabled ? "text-[#8a8d94]" : destructive ? "text-[#e31a24]" : "text-[#09090b]"
              )}
            >
              {label}
            </span>
          </>
        )}
      </div>
      {!isPerson && iconRight && rightIconName ? (
        <IconsLight
          icon={rightIconName}
          className={cn(
            "h-4 w-4",
            isDisabled ? "text-[#8a8d94]" : destructive ? "text-[#e31a24]" : "text-[#09090b]"
          )}
        />
      ) : null}
    </button>
  );
}
