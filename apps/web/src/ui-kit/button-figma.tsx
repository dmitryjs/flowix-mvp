import * as React from "react";
import { PlusIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export type FigmaButtonType = "Primary" | "Accent" | "Neutral" | "Text";
export type FigmaButtonSize = "s" | "m";
export type FigmaButtonState =
  | "Default"
  | "Hover"
  | "Loader"
  | "Disabled"
  | "Clicked";
export type FigmaButtonContent = "❖ Label" | "Label" | "❖";

type FigmaButtonProps = {
  content?: FigmaButtonContent;
  size?: FigmaButtonSize;
  state?: FigmaButtonState;
  buttonType?: FigmaButtonType;
  nativeType?: "button" | "submit" | "reset";
  disabled?: boolean;
  label?: string;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "type">;

const STYLE_MAP: Record<
  FigmaButtonType,
  Record<FigmaButtonState, { bg: string; text: string; border?: string }>
> = {
  Primary: {
    Default: { bg: "bg-[#2d4ffa]", text: "text-white" },
    Hover: { bg: "bg-[#2444f0]", text: "text-white" },
    Clicked: { bg: "bg-[#1b37d2]", text: "text-white" },
    Loader: { bg: "bg-[#2d4ffa]", text: "text-white" },
    Disabled: { bg: "bg-[#8f9df4]", text: "text-white" },
  },
  Accent: {
    Default: { bg: "bg-[#fc5415]", text: "text-white" },
    Hover: { bg: "bg-[#f14f13]", text: "text-white" },
    Clicked: { bg: "bg-[#df4409]", text: "text-white" },
    Loader: { bg: "bg-[#fc5415]", text: "text-white" },
    Disabled: { bg: "bg-[#f1a384]", text: "text-white" },
  },
  Neutral: {
    Default: { bg: "bg-[#eeeff0]", text: "text-[#09090b]" },
    Hover: { bg: "bg-[#e4e5e7]", text: "text-[#09090b]" },
    Clicked: { bg: "bg-[#cfd2d6]", text: "text-[#09090b]" },
    Loader: { bg: "bg-[#eeeff0]", text: "text-[#09090b]" },
    Disabled: { bg: "bg-[#eeeff0]", text: "text-[#8a8d94]" },
  },
  Text: {
    Default: { bg: "bg-transparent", text: "text-[#09090b]" },
    Hover: { bg: "bg-[#eeeff0]", text: "text-[#09090b]" },
    Clicked: { bg: "bg-[#dfe2e6]", text: "text-[#09090b]" },
    Loader: { bg: "bg-transparent", text: "text-[#09090b]" },
    Disabled: { bg: "bg-transparent", text: "text-[#8a8d94]" },
  },
};

export const ButtonFigma = React.forwardRef<HTMLButtonElement, FigmaButtonProps>(
  (
    {
      content = "Label",
      size = "s",
      state = "Default",
      buttonType = "Primary",
      nativeType = "button",
      label = "Button",
      className,
      ...props
    },
    ref
  ) => {
    const style = STYLE_MAP[buttonType][state];
    const disabled = state === "Disabled" || props.disabled;
    const isLoader = state === "Loader";
    const iconSizeClass = size === "m" ? "h-5 w-5" : "h-[18px] w-[18px]";
    const textSizeClass = size === "m" ? "text-sm" : "text-xs";
    const heightClass = size === "m" ? "h-11" : "h-8";

    const paddingClass =
      content === "❖"
        ? "px-3"
        : content === "❖ Label"
        ? "pl-2 pr-3"
        : "px-4";

    return (
      <button
        ref={ref}
        type={nativeType}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-lg font-medium transition-colors",
          heightClass,
          paddingClass,
          style.bg,
          style.text,
          textSizeClass,
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          className
        )}
        {...props}
      >
        {isLoader ? (
          <Loader2Icon className={cn(iconSizeClass, "animate-spin")} />
        ) : (
          <>
            {(content === "❖ Label" || content === "❖") && (
              <PlusIcon className={iconSizeClass} />
            )}
            {content !== "❖" && <span>{label}</span>}
          </>
        )}
      </button>
    );
  }
);

ButtonFigma.displayName = "ButtonFigma";
