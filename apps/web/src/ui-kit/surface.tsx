import * as React from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "muted";
};

export function Surface({
  className,
  tone = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        tone === "muted"
          ? "border-[#e5e7eb] bg-[#f8f8f9]"
          : "border-[#d7d8db] bg-white",
        className
      )}
      {...props}
    />
  );
}
