import { AlertTriangleIcon, CheckCircleIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SnackType = "success" | "error";

type SnackProps = {
  className?: string;
  type?: SnackType;
  message?: string;
  onClose?: () => void;
};

export function Snack({
  className,
  type = "success",
  message,
  onClose,
}: SnackProps) {
  const isError = type === "error";
  const text = message ?? (isError ? "Something went wrong!" : "Project created!");

  return (
    <div
      className={cn(
        "flex w-[266px] items-center justify-between rounded-2xl border p-4",
        isError
          ? "border-[#e31a24] bg-[#ffd3d5]"
          : "border-[#32bd17] bg-[#e4f0e1]",
        className
      )}
      data-name="Snack"
      data-node-id={isError ? "57:4386" : "57:4380"}
    >
      <div className="flex items-center gap-2">
        {isError ? (
          <AlertTriangleIcon className="h-5 w-5 text-[#b41d24]" />
        ) : (
          <CheckCircleIcon className="h-5 w-5 text-[#298417]" />
        )}
        <p
          className={cn(
            "text-sm font-medium leading-normal",
            isError ? "text-[#b41d24]" : "text-[#298417]"
          )}
        >
          {text}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-md",
          isError ? "text-[#b41d24] hover:bg-[#f7bcc0]" : "text-[#298417] hover:bg-[#d3e8ce]"
        )}
      >
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
