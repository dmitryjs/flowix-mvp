import { cn } from "@/lib/utils";

type ClickAreaProps = {
  className?: string;
  x?: number;
  y?: number;
};

export function ClickArea({ className, x = 50, y = 50 }: ClickAreaProps) {
  return (
    <div
      className={cn(
        "absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 overflow-clip rounded-full",
        className
      )}
      data-name="Click area"
      data-node-id="57:3405"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        background:
          "radial-gradient(circle at center, rgba(255,0,0,1) 0%, rgba(255,117,0,1) 26%, rgba(255,234,0,1) 52%, rgba(30,255,0,0.5) 82%, rgba(79,31,255,0) 100%)",
      }}
    />
  );
}
