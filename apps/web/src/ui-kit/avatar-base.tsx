import { cn } from "@/lib/utils";

type AvatarBaseProps = {
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function AvatarBase({
  initials = "U",
  size = "md",
  className,
}: AvatarBaseProps) {
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-10 w-10 text-sm";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[#d7d8db] bg-[#f3f4f6] font-medium text-[#09090b]",
        sizeClass,
        className
      )}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
