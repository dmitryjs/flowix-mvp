import Image from "next/image";
import { cn } from "@/lib/utils";
import logoImage from "@/ui-kit/logo.png";

type FlowixLogoProps = {
  className?: string;
};

export function FlowixLogo({ className }: FlowixLogoProps) {
  return (
    <Image
      src={logoImage}
      alt="Flowix"
      className={cn("h-[18px] w-[90px]", className)}
      priority
    />
  );
}
