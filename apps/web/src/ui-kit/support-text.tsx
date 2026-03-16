import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const supportTextVariants = cva("text-xs leading-4 tracking-[0.01px]", {
  variants: {
    type: {
      hint: "text-[#8a8d94]",
      error: "text-[#e31a24]",
    },
  },
  defaultVariants: {
    type: "hint",
  },
});

export type SupportTextProps = {
  text?: string;
  visible?: boolean;
  className?: string;
} & VariantProps<typeof supportTextVariants>;

export function SupportText({
  text,
  visible = true,
  type,
  className,
}: SupportTextProps) {
  if (!visible || !text) return null;
  return <p className={cn(supportTextVariants({ type }), className)}>{text}</p>;
}
