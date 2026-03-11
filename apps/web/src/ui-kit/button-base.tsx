import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonBaseVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#09090b] text-white hover:bg-[#1f1f21]",
        secondary: "border border-[#d7d8db] bg-white text-[#09090b] hover:bg-[#f7f7f8]",
        ghost: "bg-transparent text-[#09090b] hover:bg-[#f0f1f2]",
        destructive: "bg-[#e31a24] text-white hover:bg-[#c1141d]",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonBaseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonBaseVariants> {}

export const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonBaseProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonBaseVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

ButtonBase.displayName = "ButtonBase";
