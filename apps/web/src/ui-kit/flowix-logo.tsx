import { cn } from "@/lib/utils";

const imgVector = "https://www.figma.com/api/mcp/asset/a51d57a6-2223-4edc-82a2-eb8131bef6b5";
const imgVector1 = "https://www.figma.com/api/mcp/asset/056f9221-75f6-4fda-89f6-5060faf4caf8";
const imgVector2 = "https://www.figma.com/api/mcp/asset/12698dc5-61ee-486e-a3a9-a53d2d4df0f2";
const imgVector3 = "https://www.figma.com/api/mcp/asset/a1b5ff8d-b9fa-46b3-af9d-1ee197cebb1f";
const imgVector4 = "https://www.figma.com/api/mcp/asset/9faec944-a9e9-41fe-ae4c-4d0e693f84e8";
const imgVector5 = "https://www.figma.com/api/mcp/asset/c9c5adc3-3e7f-4d7d-9170-eb1a6fa64a63";
const imgVector6 = "https://www.figma.com/api/mcp/asset/06944419-010c-4440-9069-8f472772d3e8";
const imgVector7 = "https://www.figma.com/api/mcp/asset/3645d0b0-c7d4-48b5-966f-8a7cf35c1269";
const imgVector8 = "https://www.figma.com/api/mcp/asset/d86b5eaf-de2f-4f61-9a3a-e2d73410d8c4";

type FlowixLogoProps = {
  className?: string;
};

export function FlowixLogo({ className }: FlowixLogoProps) {
  return (
    <div
      className={cn("relative h-[18px] w-[90px]", className)}
      data-name="logo"
      data-node-id="57:3394"
    >
      <div className="absolute inset-[0_92.72%_2.44%_0]" data-node-id="57:3395">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector} />
      </div>
      <div className="absolute inset-[0_82.79%_2.44%_9.93%]" data-node-id="57:3396">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector1} />
      </div>
      <div className="absolute inset-[65.04%_76.83%_18.7%_19.86%]" data-node-id="57:3397">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector2} />
      </div>
      <div className="absolute inset-[0_63.6%_18.7%_25.82%]" data-node-id="57:3398">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector3} />
      </div>
      <div className="absolute inset-[0_53.66%_18.7%_37.74%]" data-node-id="57:3399">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector4} />
      </div>
      <div className="absolute inset-[0_39.76%_18.7%_48.99%]" data-node-id="57:3400">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector5} />
      </div>
      <div className="absolute inset-[0_20.59%_18.7%_62.87%]" data-node-id="57:3401">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector6} />
      </div>
      <div className="absolute inset-[0_14.65%_18.7%_82.04%]" data-node-id="57:3402">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector7} />
      </div>
      <div className="absolute inset-[0_1.41%_18.7%_88%]" data-node-id="57:3403">
        <img alt="" className="absolute block size-full max-w-none" src={imgVector8} />
      </div>
    </div>
  );
}
