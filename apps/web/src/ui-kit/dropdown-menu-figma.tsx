import { MenuItem } from "@/ui-kit/menu-item";
import { cn } from "@/lib/utils";

export type DropdownMenuFigmaType = "Default" | "profile";

type DropdownMenuFigmaProps = {
  className?: string;
  type?: DropdownMenuFigmaType;
  personName?: string;
  personEmail?: string;
  personInitials?: string;
  onMyProfile?: () => void;
  onBilling?: () => void;
  onLogout?: () => void;
};

export function DropdownMenuFigma({
  className,
  type = "Default",
  personName = "Dmitry Galkin",
  personEmail = "example@gmail.com",
  personInitials = "CN",
  onMyProfile,
  onBilling,
  onLogout,
}: DropdownMenuFigmaProps) {
  const isProfile = type === "profile";

  return (
    <div
      className={cn(
        "flex w-[214px] flex-col items-start rounded-md border border-[#dbdcdd] bg-white p-1.5 shadow-[0px_4px_6px_0px_rgba(0,0,0,0.09)]",
        className
      )}
      data-name="Dropdown menu"
      data-node-id={isProfile ? "57:4536" : "57:4531"}
    >
      {isProfile ? (
        <>
          <MenuItem
            itemType="Person"
            state="Default"
            personName={personName}
            personEmail={personEmail}
            personInitials={personInitials}
            iconLeft={false}
            iconRight={false}
            className="w-full"
          />
          <MenuItem
            label="My profile"
            leftIconName="person"
            rightIconName={null}
            iconRight={false}
            className="w-full"
            onClick={onMyProfile}
          />
          <MenuItem
            label="Billing"
            leftIconName="billing"
            rightIconName={null}
            iconRight={false}
            className="w-full"
            onClick={onBilling}
          />
          <MenuItem
            label="Log out"
            leftIconName="log out"
            rightIconName={null}
            iconRight={false}
            className="w-full"
            onClick={onLogout}
          />
        </>
      ) : (
        <>
          <MenuItem className="w-full" />
          <MenuItem className="w-full" />
          <MenuItem className="w-full" />
          <MenuItem className="w-full" />
        </>
      )}
    </div>
  );
}
