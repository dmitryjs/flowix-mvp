import { IconsLight } from "@/ui-kit/icons-light";
import { cn } from "@/lib/utils";

export type TagType = "paid" | "waiting for payment";

type TagsProps = {
  className?: string;
  type?: TagType;
};

export function Tags({ className, type = "paid" }: TagsProps) {
  const isWaiting = type === "waiting for payment";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-[52px] pl-2 pr-3 py-2",
        isWaiting ? "bg-[#2d4ffa1a]" : "bg-[#32bd171a]",
        className
      )}
      data-name="Tags"
      data-node-id={isWaiting ? "57:4662" : "57:4659"}
    >
      <IconsLight
        icon={isWaiting ? "clock" : "check"}
        className={cn("h-4 w-4", isWaiting ? "text-[#2d4ffa]" : "text-[#32bd17]")}
      />
      <span
        className={cn(
          "whitespace-nowrap text-xs font-medium leading-4",
          isWaiting ? "text-[#2d4ffa]" : "text-[#32bd17]"
        )}
      >
        {isWaiting ? "Waiting for payment" : "Paid"}
      </span>
    </div>
  );
}
