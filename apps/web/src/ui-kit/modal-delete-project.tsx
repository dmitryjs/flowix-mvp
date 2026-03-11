import { cn } from "@/lib/utils";
import { IconsFilled } from "@/ui-kit/icons-filled";
import { IconsLight } from "@/ui-kit/icons-light";

type ModalDeleteProjectProps = {
  className?: string;
  deleting?: boolean;
  onClose?: () => void;
  onDelete?: () => void;
};

export function ModalDeleteProject({
  className,
  deleting = false,
  onClose,
  onDelete,
}: ModalDeleteProjectProps) {
  return (
    <section
      className={cn("w-[420px] overflow-hidden rounded-xl bg-white px-3 py-4", className)}
      data-name="modal/delete-project"
      data-node-id="57:3055"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <header className="flex w-full items-center justify-between">
          <div className="h-7 w-7 shrink-0" />
          <h3 className="text-base font-semibold leading-4 text-[#09090b]">Delete project</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delete project modal"
            className="inline-flex h-[30px] w-8 shrink-0 items-center justify-center rounded-lg bg-[#eeeff0] text-[#09090b]"
          >
            <IconsFilled icon="Close" className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="flex flex-col items-center gap-2 py-8">
          <div className="flex items-center rounded-[65px] bg-[rgba(227,26,36,0.05)] p-3">
            <IconsLight icon="delete" className="h-6 w-6 text-[#e31a24]" />
          </div>
          <p className="text-base font-semibold leading-4 text-[#09090b]">Are you sure?</p>
          <p className="text-sm leading-4 text-[#71717a]">You are going to delete this project</p>
        </div>

        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#e31a24] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete project"}
        </button>
      </div>
    </section>
  );
}
