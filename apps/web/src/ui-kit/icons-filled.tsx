import type { LucideIcon } from "lucide-react";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  BellIcon,
  CheckCircle2Icon,
 CheckIcon,
 ChevronDownIcon,
 ChevronUpIcon,
 CopyIcon,
 CrownIcon,
 EllipsisIcon,
 Grid2x2Icon,
 HeartIcon,
 Loader2Icon,
 LogInIcon,
 MenuIcon,
 MessageCircleIcon,
 PencilIcon,
 PlaneIcon,
 PlusIcon,
 Rows3Icon,
 SendIcon,
 StarIcon,
 XCircleIcon,
 XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type FilledIconName =
  | "Plus"
  | "Menu"
  | "Close"
  | "check"
  | "warning"
  | "Notification"
  | "Login"
  | "Grid - Horizontal"
  | "Grid - Blocks"
  | "Triangle - Up"
  | "Triangle - Down"
  | "Chat"
  | "Star"
  | "Send"
  | "Load"
  | "Dots"
  | "Crown"
  | "Close Circle"
  | "Back"
  | "Expand"
  | "edit"
  | "copy"
  | "toggle - off"
  | "toggle - on"
  | "heart"
  | "telegram";

type IconsFilledProps = {
  className?: string;
  icon?: FilledIconName;
};

const ICON_MAP: Partial<Record<FilledIconName, LucideIcon>> = {
  Plus: PlusIcon,
  Menu: MenuIcon,
  Close: XIcon,
  check: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  Notification: BellIcon,
  Login: LogInIcon,
  "Grid - Horizontal": Rows3Icon,
  "Grid - Blocks": Grid2x2Icon,
  "Triangle - Up": ChevronUpIcon,
  "Triangle - Down": ChevronDownIcon,
  Chat: MessageCircleIcon,
  Star: StarIcon,
  Send: SendIcon,
  Dots: EllipsisIcon,
  Crown: CrownIcon,
  "Close Circle": XCircleIcon,
  Back: ArrowLeftIcon,
  Expand: ArrowUpIcon,
  edit: PencilIcon,
  copy: CopyIcon,
  heart: HeartIcon,
  telegram: PlaneIcon,
};

function ToggleIcon({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-3 w-[18px] rounded-full",
        on ? "bg-[#09090b]" : "bg-[#8f9298]"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white",
          on ? "right-1" : "left-1"
        )}
      />
    </span>
  );
}

export function IconsFilled({ className, icon = "Plus" }: IconsFilledProps) {
  if (icon === "Load") {
    return <Loader2Icon className={cn("h-6 w-6 animate-spin", className)} />;
  }

  if (icon === "toggle - on") {
    return (
      <span className={cn("inline-flex h-6 w-6 items-center justify-center", className)}>
        <ToggleIcon on />
      </span>
    );
  }

  if (icon === "toggle - off") {
    return (
      <span className={cn("inline-flex h-6 w-6 items-center justify-center", className)}>
        <ToggleIcon on={false} />
      </span>
    );
  }

  const IconComponent = ICON_MAP[icon] ?? CheckIcon;
  return <IconComponent className={cn("h-6 w-6", className)} />;
}
