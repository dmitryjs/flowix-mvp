import type { LucideIcon } from "lucide-react";
import {
  CheckIcon,
  Clock3Icon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  ImageIcon,
  LogOutIcon,
  PencilIcon,
  PlaneIcon,
  RefreshCcwIcon,
  Settings2Icon,
  Share2Icon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LightIconName =
  | "delete"
  | "edit"
  | "settings"
  | "share"
  | "folder"
  | "docs"
  | "person"
  | "log out"
  | "billing"
  | "image"
  | "check"
  | "clock"
  | "telegram"
  | "repeat";

type IconsLightProps = {
  className?: string;
  icon?: LightIconName;
};

const ICON_MAP: Record<LightIconName, LucideIcon> = {
  delete: Trash2Icon,
  edit: PencilIcon,
  settings: Settings2Icon,
  share: Share2Icon,
  folder: FolderIcon,
  docs: FileTextIcon,
  person: UserIcon,
  "log out": LogOutIcon,
  billing: CreditCardIcon,
  image: ImageIcon,
  check: CheckIcon,
  clock: Clock3Icon,
  telegram: PlaneIcon,
  repeat: RefreshCcwIcon,
};

export function IconsLight({ className, icon = "settings" }: IconsLightProps) {
  const IconComponent = ICON_MAP[icon];
  return <IconComponent className={cn("h-6 w-6", className)} />;
}
