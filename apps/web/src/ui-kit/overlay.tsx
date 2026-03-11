import { cn } from "@/lib/utils";

type OverlayProps = {
  className?: string;
};

export function Overlay({ className }: OverlayProps) {
  return (
    <div
      className={cn("absolute inset-0 backdrop-blur-[2px] bg-[rgba(0,0,0,0.3)]", className)}
      data-name="overlay"
      data-node-id="57:3392"
    />
  );
}
