import { cn } from "@/lib/utils";
import { ButtonFigma } from "@/ui-kit/button-figma";
import { IconsFilled } from "@/ui-kit/icons-filled";
import { IconsLight } from "@/ui-kit/icons-light";

type ModalDeleteProjectProps = {
  className?: string;
  projectName?: string;
  deleting?: boolean;
  onClose?: () => void;
  onDelete?: () => void;
};

export function ModalDeleteProject({
  className,
  projectName = "Project name",
  deleting = false,
  onClose,
  onDelete,
}: ModalDeleteProjectProps) {
  return (
    <section className={cn("w-[420px] rounded-xl bg-white px-3 py-4", className)}>
      <div className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <div className="h-7 w-7" />
          <h3 className="text-base font-semibold leading-4 text-[#09090b]">Delete project</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delete project modal"
            className="inline-flex h-[30px] w-8 items-center justify-center rounded-lg bg-[#eeeff0] text-[#09090b]"
          >
            <IconsFilled icon="Close" className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="rounded-lg border border-[#f2c4c7] bg-[#fff4f5] px-3 py-2">
          <div className="flex items-start gap-2">
            <IconsFilled icon="warning" className="h-[18px] w-[18px] text-[#e31a24]" />
            <div className="flex flex-col">
              <p className="text-sm font-medium text-[#09090b]">This action cannot be undone.</p>
              <p className="text-xs text-[#71717a]">
                Project <span className="font-medium text-[#09090b]">{projectName}</span> and its
                related data will be removed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <ButtonFigma
            buttonType="Neutral"
            state="Default"
            size="m"
            content="Label"
            label="Cancel"
            onClick={onClose}
            className="w-full"
          />
          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="inline-flex h-11 w-full items-center justify-center gap-1 rounded-lg bg-[#e31a24] px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            <IconsLight icon="delete" className="h-[18px] w-[18px]" />
            {deleting ? "Deleting..." : "Delete project"}
          </button>
        </div>
      </div>
    </section>
  );
}
