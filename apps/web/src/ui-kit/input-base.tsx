import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { SupportText } from "@/ui-kit/support-text";

const inputBaseVariants = cva(
  "flex h-11 w-full items-center rounded-lg border text-sm transition-colors",
  {
    variants: {
      state: {
        default: "border-transparent bg-[#ecedee] text-[#09090b]",
        hover: "border-transparent bg-[#e8e8ea] text-[#09090b]",
        active: "border-transparent bg-[#ebebed] text-[#09090b]",
        focus: "border-[#2d4ffa] bg-[#ecedee] text-[#09090b]",
        typing: "border-[#2d4ffa] bg-[#ecedee] text-[#09090b]",
        filled: "border-transparent bg-[#ecedee] text-[#09090b]",
        error: "border-[#e31a24] bg-[#e8e8ea] text-[#09090b]",
        errorFilled: "border-[#e31a24] bg-[#ecedee] text-[#09090b]",
        disabled: "border-transparent bg-[#ecedee] text-[#09090b] opacity-50",
        disabledFilled:
          "border-transparent bg-[#ecedee] text-[#09090b] opacity-50",
      },
      hasLeading: {
        true: "pl-2",
        false: "pl-4",
      },
      hasTrailing: {
        true: "pr-2",
        false: "pr-4",
      },
    },
    defaultVariants: {
      state: "default",
      hasLeading: false,
      hasTrailing: false,
    },
  }
);

const labelVariants = cva("text-[10px] leading-[14px] tracking-[0.1px]", {
  variants: {
    state: {
      typing: "text-[#8a8d94]",
      focus: "text-[#8a8d94]",
      filled: "text-[#8a8d94]",
      disabledFilled: "text-[#8a8d94]",
      errorFilled: "text-[#8a8d94]",
      default: "text-[#8a8d94]",
      hover: "text-[#8a8d94]",
      active: "text-[#8a8d94]",
      error: "text-[#8a8d94]",
      disabled: "text-[#8a8d94]",
    },
  },
  defaultVariants: {
    state: "default",
  },
});

const valueVariants = cva("text-sm leading-5", {
  variants: {
    state: {
      typing: "text-[#09090b]",
      filled: "text-[#09090b]",
      disabledFilled: "text-[#09090b]",
      errorFilled: "text-[#09090b]",
      default: "text-[#8a8d94]",
      hover: "text-[#8a8d94]",
      active: "text-[#8a8d94]",
      focus: "text-[#8a8d94]",
      error: "text-[#8a8d94]",
      disabled: "text-[#8a8d94]",
    },
  },
  defaultVariants: {
    state: "default",
  },
});

export type InputBaseState =
  | "default"
  | "hover"
  | "active"
  | "focus"
  | "typing"
  | "filled"
  | "error"
  | "errorFilled"
  | "disabled"
  | "disabledFilled";

type InputBaseProps = {
  label?: string;
  valueText?: string;
  supportTextVisible?: boolean;
  supportText?: string;
  supportType?: "hint" | "error";
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
} & VariantProps<typeof inputBaseVariants>;

export function InputBase({
  label = "Label",
  valueText,
  supportTextVisible = true,
  supportText = "Hint Message",
  supportType = "hint",
  leading,
  trailing,
  state = "default",
  className,
}: InputBaseProps) {
  const hasLeading = Boolean(leading);
  const hasTrailing = Boolean(trailing);
  const showValue =
    state === "typing" ||
    state === "filled" ||
    state === "disabledFilled" ||
    state === "errorFilled";
  const showCaret = state === "typing" || state === "focus";

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <div
        className={cn(inputBaseVariants({ state, hasLeading, hasTrailing }), "gap-1")}
      >
        {hasLeading ? (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center text-[#8a8d94]">
            {leading}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className={cn(labelVariants({ state }))}>{label}</p>
          {showValue ? (
            <div className="flex items-center">
              <p className={cn(valueVariants({ state }))}>{valueText ?? "Input text"}</p>
              {showCaret ? <span className="text-[#2d4ffa]">|</span> : null}
            </div>
          ) : showCaret ? (
            <p className="text-sm leading-5 text-[#2d4ffa]">|</p>
          ) : null}
        </div>

        {hasTrailing ? (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center text-[#8a8d94]">
            {trailing}
          </div>
        ) : null}
      </div>

      <SupportText
        visible={supportTextVisible}
        text={supportText}
        type={supportType === "error" ? "error" : "hint"}
      />
    </div>
  );
}
