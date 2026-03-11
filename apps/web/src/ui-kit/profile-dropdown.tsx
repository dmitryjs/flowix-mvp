import { cn } from "@/lib/utils";
import { AvatarBase } from "@/ui-kit/avatar-base";
import { DropdownMenuFigma } from "@/ui-kit/dropdown-menu-figma";

type ProfileDropdownProps = {
  className?: string;
  active?: boolean;
  avatarImageSrc?: string;
  avatarAlt?: string;
  personName?: string;
  personEmail?: string;
  personInitials?: string;
  onMyProfile?: () => void;
  onBilling?: () => void;
  onLogout?: () => void;
};

export function ProfileDropdown({
  className,
  active = true,
  avatarImageSrc,
  avatarAlt = "User avatar",
  personName = "Dmitry Galkin",
  personEmail = "example@gmail.com",
  personInitials = "CN",
  onMyProfile,
  onBilling,
  onLogout,
}: ProfileDropdownProps) {
  return (
    <div className={cn("relative h-8 w-8", className)} data-name="Profile dropdown" data-node-id="57:4541">
      {avatarImageSrc ? (
        <img
          src={avatarImageSrc}
          alt={avatarAlt}
          className="absolute inset-0 h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <AvatarBase initials={personInitials} size="sm" className="absolute inset-0 border-none bg-[#f4f4f5]" />
      )}

      {active ? (
        <DropdownMenuFigma
          type="profile"
          className="absolute left-[-182px] top-10"
          personName={personName}
          personEmail={personEmail}
          personInitials={personInitials}
          onMyProfile={onMyProfile}
          onBilling={onBilling}
          onLogout={onLogout}
        />
      ) : null}
    </div>
  );
}
