import { useState } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonFigma } from "@/ui-kit/button-figma";

type ModalCreateProjectProps = {
  className?: string;
  title?: string;
  projectName?: string;
  projectNamePlaceholder?: string;
  ctaLabel?: string;
  onProjectNameChange?: (value: string) => void;
  onClose?: () => void;
  onSubmit?: () => void;
};

export function ModalCreateProject({
  className,
  title = "Create project",
  projectName = "",
  projectNamePlaceholder = "Project name",
  ctaLabel = "Create project",
  onProjectNameChange,
  onClose,
  onSubmit,
}: ModalCreateProjectProps) {
  const [inputHovered, setInputHovered] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const hasInputValue = projectName.trim().length > 0;
  const inputState = (() => {
    if (inputFocused && hasInputValue) return "typing";
    if (inputFocused) return "focus";
    if (inputHovered) return "hover";
    if (hasInputValue) return "filled";
    return "default";
  })();

  const showFloatingLabel =
    inputState === "focus" || inputState === "typing" || inputState === "filled";

  return (
    <section
      className={cn(
        "w-[420px] overflow-hidden rounded-xl bg-white px-3 py-4",
        className
      )}
      data-name="modal/create-project"
      data-node-id="57:3383"
    >
      <div className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <div className="h-7 w-7" />
          <h3 className="text-base font-semibold leading-4 text-[#09090b]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create project modal"
            className="inline-flex h-[30px] w-8 items-center justify-center rounded-lg bg-[#eeeff0] text-[#09090b] hover:bg-[#e4e5e7]"
          >
            <XIcon className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="flex flex-col gap-2.5">
          <div
            className={`relative h-11 w-full rounded-lg border ${
              inputState === "hover"
                ? "border-transparent bg-[#e8e8ea]"
                : inputState === "focus" || inputState === "typing"
                ? "border-[#2d4ffa] bg-[#ecedee]"
                : "border-transparent bg-[#ecedee]"
            }`}
            onMouseEnter={() => setInputHovered(true)}
            onMouseLeave={() => setInputHovered(false)}
          >
            {showFloatingLabel ? (
              <label
                htmlFor="project-name-input"
                className="pointer-events-none absolute left-4 top-1 text-[10px] leading-[14px] tracking-[0.1px] text-[#8a8d94]"
              >
                Project name
              </label>
            ) : null}
            <input
              id="project-name-input"
              name="project-name-input"
              type="text"
              value={projectName}
              onChange={(event) => onProjectNameChange?.(event.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={projectNamePlaceholder}
              className={`h-full w-full bg-transparent px-4 text-sm leading-5 text-[#09090b] outline-none ${
                showFloatingLabel
                  ? "pb-1 pt-4 placeholder:text-transparent"
                  : "placeholder:text-[#8a8d94]"
              }`}
            />
          </div>
          <ButtonFigma
            buttonType="Primary"
            state="Default"
            size="m"
            content="Label"
            label={ctaLabel}
            onClick={onSubmit}
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
