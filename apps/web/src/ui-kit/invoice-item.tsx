import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tags } from "@/ui-kit/tags";

export type InvoiceStatus = "paid" | "waiting for payment";

type InvoiceLine = {
  summary: string;
  usage: string;
  unitPrice: string;
  amount: string;
};

type InvoiceItemProps = {
  className?: string;
  opened?: boolean;
  status?: InvoiceStatus;
  dateLabel?: string;
  screensLabel?: string;
  totalLabel?: string;
  totalValue?: string;
  price?: string;
  createdLabel?: string;
  paidLabel?: string;
  lines?: InvoiceLine[];
  payButtonLabel?: string;
  onToggle?: () => void;
  onPay?: () => void;
};

const DEFAULT_LINES: InvoiceLine[] = [
  { summary: "Free flow screens", usage: "5", unitPrice: "0 ₽", amount: "0 ₽" },
  { summary: "Extra flow screens", usage: "12", unitPrice: "20 ₽", amount: "240 ₽" },
];

export function InvoiceItem({
  className,
  opened = false,
  status = "paid",
  dateLabel = "23 April, 2026",
  screensLabel = "14 screens",
  totalLabel = "TOTAL",
  totalValue = "240 ₽",
  price = "350 ₽",
  createdLabel = "Created 23 April, 2026",
  paidLabel = "Paid on 23 April, 2026",
  lines = DEFAULT_LINES,
  payButtonLabel = "Pay with SBP",
  onToggle,
  onPay,
}: InvoiceItemProps) {
  const isWaiting = status === "waiting for payment";

  return (
    <article className={cn("w-full border-b border-[#dbdcdd] bg-white", className)}>
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold leading-4 text-[#09090b]">{dateLabel}</p>
          <p className="text-sm leading-4 text-[#71717a]">{screensLabel}</p>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <p className="text-base font-semibold leading-4 text-[#09090b]">{price}</p>
            <Tags type={isWaiting ? "waiting for payment" : "paid"} />
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#09090b] hover:bg-[#eeeff0]"
            aria-label={opened ? "Collapse invoice" : "Expand invoice"}
          >
            {opened ? <ChevronUpIcon className="h-[18px] w-[18px]" /> : <ChevronDownIcon className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {opened && (
        <>
          <section className="border-t border-[#dbdcdd] bg-[#fafafa] p-5">
            <div className="flex flex-col gap-5">
              <p className="text-sm font-medium leading-4 text-[#09090b]">
                {isWaiting ? createdLabel : paidLabel}
              </p>

              {lines.map((line, index) => (
                <React.Fragment key={`${line.summary}-${index}`}>
                  <div className="h-px w-full bg-[#dbdcdd]" />
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-xs font-medium leading-4 text-[#8a8d94]">SUMMARY</p>
                      <p className="text-sm font-medium leading-4 text-[#09090b]">{line.summary}</p>
                    </div>
                    <div className="flex items-center gap-[60px] text-right">
                      <div className="w-[119px]">
                        <p className="text-xs font-medium leading-4 text-[#8a8d94]">USAGE</p>
                        <p className="text-sm font-medium leading-4 text-[#09090b]">{line.usage}</p>
                      </div>
                      <div className="w-[119px]">
                        <p className="text-xs font-medium leading-4 text-[#8a8d94]">UNIT PRICE</p>
                        <p className="text-sm font-medium leading-4 text-[#09090b]">{line.unitPrice}</p>
                      </div>
                      <div className="w-[119px]">
                        <p className="text-xs font-medium leading-4 text-[#8a8d94]">AMMOUNT</p>
                        <p className="text-sm font-medium leading-4 text-[#09090b]">{line.amount}</p>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </section>

          {isWaiting && (
            <footer className="border-t border-[#dbdcdd] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium leading-4 text-[#8a8d94]">{totalLabel}</p>
                  <p className="text-sm font-bold leading-4 text-[#09090b]">{totalValue}</p>
                </div>
                <button
                  type="button"
                  onClick={onPay}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2d4ffa] px-4 text-sm font-medium leading-5 text-[#fafafa] shadow-[0px_1px_2px_0px_rgba(26,26,26,0.05)] hover:bg-[#2444f0]"
                >
                  {payButtonLabel}
                </button>
              </div>
            </footer>
          )}
        </>
      )}
    </article>
  );
}
