"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { IconsFilled, IconsLight, Snack } from "@/ui-kit";
import { cn } from "@/lib/utils";

type InputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
};

function InputField({ id, label, value, onChange, type = "text", placeholder, readOnly }: InputFieldProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const hasValue = value.trim().length > 0;
  const inputState = (() => {
    if (focused && hasValue) return "typing";
    if (focused) return "focus";
    if (hovered) return "hover";
    if (hasValue) return "filled";
    return "default";
  })();

  const showFloating = inputState === "focus" || inputState === "typing" || inputState === "filled";

  return (
    <div
      className={cn(
        "relative h-11 w-full rounded-lg border transition-colors",
        inputState === "hover" ? "border-transparent bg-[#e8e8ea]" :
        inputState === "focus" || inputState === "typing" ? "border-[#2d4ffa] bg-[#ecedee]" :
        "border-transparent bg-[#ecedee]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showFloating && (
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-1 text-[10px] leading-[14px] tracking-[0.1px] text-[#8a8d94]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={showFloating ? undefined : (placeholder ?? label)}
        className={cn(
          "h-full w-full bg-transparent px-4 text-sm leading-5 text-[#09090b] outline-none",
          showFloating ? "pb-1 pt-4 placeholder:text-transparent" : "placeholder:text-[#8a8d94]",
          readOnly && "cursor-default"
        )}
      />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSnack, setShowSnack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [backHovered, setBackHovered] = useState(false);
  const [backPressed, setBackPressed] = useState(false);
  const [blogHovered, setBlogHovered] = useState(false);
  const [blogPressed, setBlogPressed] = useState(false);
  const [feedbackHovered, setFeedbackHovered] = useState(false);
  const [feedbackPressed, setFeedbackPressed] = useState(false);

  const initialFirstName = useRef("");
  const initialLastName = useRef("");

  const PRODUCT_BLOG_ICON_IMG = "https://www.figma.com/api/mcp/asset/e196d238-6d56-49e0-afc8-2f42c3dcbef0";
  const FEEDBACK_ICON_IMG = "https://www.figma.com/api/mcp/asset/4a53988d-c4e7-4152-9dd8-923d2b1b6983";

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const meta = user.user_metadata as { first_name?: string; last_name?: string; avatar_url?: string } | undefined;
      const fn = meta?.first_name ?? "";
      const ln = meta?.last_name ?? "";
      setUserEmail(user.email ?? "");
      setFirstName(fn);
      setLastName(ln);
      setAvatarUrl(meta?.avatar_url ?? null);
      initialFirstName.current = fn;
      initialLastName.current = ln;
    };
    void load();
  }, [router]);

  const avatarLabel = userEmail.trim().charAt(0).toUpperCase() || "U";

  const hasChanges =
    firstName !== initialFirstName.current ||
    lastName !== initialLastName.current ||
    currentPassword.trim().length > 0 ||
    newPassword.trim().length > 0;

  const handleSave = async () => {
    const supabase = getSupabaseClient();
    setSaving(true);
    setError(null);

    const updates: Record<string, unknown> = {};

    if (firstName !== initialFirstName.current || lastName !== initialLastName.current) {
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { first_name: firstName, last_name: lastName },
      });
      if (metaErr) {
        setError(metaErr.message);
        setSaving(false);
        return;
      }
      initialFirstName.current = firstName;
      initialLastName.current = lastName;
    }

    if (newPassword.trim().length > 0) {
      const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
      if (passErr) {
        setError(passErr.message);
        setSaving(false);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
    }

    void updates;
    setSaving(false);
    setShowSnack(true);
    window.setTimeout(() => setShowSnack(false), 2000);
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    await supabase.auth.updateUser({ data: { avatar_url: url } });
  };

  const getSecondaryButtonClasses = (hovered: boolean, pressed: boolean) => {
    if (pressed) return "border-[#cfd2d6] bg-transparent";
    if (hovered) return "border-[#dbdcdd] bg-transparent";
    return "border-[#dbdcdd] bg-transparent";
  };

  const getHeaderNeutralButtonClasses = (hovered: boolean, pressed: boolean) => {
    if (pressed) return "bg-[#cfd2d6]";
    if (hovered) return "bg-[#e4e5e7]";
    return "bg-[#eeeff0]";
  };

  return (
    <main className="relative min-h-screen overflow-hidden rounded-[40px] bg-[#fafafa]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1728px] flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative w-full max-w-[800px] overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white">
          <header className="flex items-center justify-between border-b border-[#e4e4e7] px-6 py-5">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => router.push("/")}
                onMouseEnter={() => setBackHovered(true)}
                onMouseLeave={() => { setBackHovered(false); setBackPressed(false); }}
                onMouseDown={() => setBackPressed(true)}
                onMouseUp={() => setBackPressed(false)}
                className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#09090b]", getHeaderNeutralButtonClasses(backHovered, backPressed))}
                aria-label="Back"
              >
                <IconsFilled icon="Back" className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[20px] font-semibold leading-4 text-[#09090b]">Profile</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!hasChanges || saving}
                onClick={() => void handleSave()}
                className={cn(
                  "inline-flex h-8 w-[123px] items-center justify-center gap-1 rounded-lg pl-2 pr-3 text-xs font-medium text-white transition-opacity",
                  hasChanges && !saving ? "bg-[#2d4ffa]" : "bg-[#2d4ffa] opacity-50 cursor-not-allowed"
                )}
              >
                <IconsLight icon="check" className="h-[18px] w-[18px]" />
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex h-8 w-[86px] items-center justify-center gap-1 rounded-lg border border-[#dbdcdd] pl-2 pr-3 text-xs font-medium text-[#09090b] hover:bg-[#f5f5f5]"
              >
                <IconsLight icon="log out" className="h-[18px] w-[18px]" />
                Log out
              </button>
            </div>
          </header>

          <div className="flex flex-col gap-10 pb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-6 px-6 py-5">
                <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#e3e3ff] text-2xl font-normal text-[#4d4dff]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    avatarLabel
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleAvatarChange(e)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-8 w-[126px] items-center justify-center gap-1 rounded-lg bg-[#eeeff0] pl-2 pr-3 text-xs font-medium text-[#09090b] hover:bg-[#e4e5e7]"
                >
                  <IconsLight icon="image" className="h-[18px] w-[18px]" />
                  Change avatar
                </button>
              </div>

              <div className="flex flex-col gap-4 px-6">
                <div className="flex gap-4">
                  <InputField
                    id="first-name"
                    label="First name"
                    value={firstName}
                    onChange={setFirstName}
                  />
                  <InputField
                    id="last-name"
                    label="Second name"
                    value={lastName}
                    onChange={setLastName}
                  />
                </div>
                <div className="w-[calc(50%-8px)]">
                  <InputField
                    id="email"
                    label="Email"
                    value={userEmail}
                    onChange={() => undefined}
                    type="email"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium leading-5 text-[#09090b]">Change password</p>
                <p className="text-sm leading-5 text-[#71717a]">You can change you current password here</p>
              </div>
              <div className="flex gap-4">
                <InputField
                  id="current-password"
                  label="Current password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  type="password"
                  placeholder="Current password"
                />
                <InputField
                  id="new-password"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  type="password"
                  placeholder="New password"
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto flex flex-wrap items-center justify-center gap-[15px] pt-4">
          <div className="rounded-lg border border-[#dbdcdd] px-3 py-2 text-xs font-medium text-[#09090b]">
            v 1.0
          </div>
          <div className="h-5 w-px bg-[#dbdcdd]" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseEnter={() => setBlogHovered(true)}
              onMouseLeave={() => { setBlogHovered(false); setBlogPressed(false); }}
              onMouseDown={() => setBlogPressed(true)}
              onMouseUp={() => setBlogPressed(false)}
              className={cn(
                "inline-flex h-8 w-[116px] items-center gap-1 rounded-lg border pl-2 pr-3 py-1.5 text-xs font-medium leading-5",
                blogHovered ? "text-[#71717a]" : "text-[#09090b]",
                getSecondaryButtonClasses(blogHovered, blogPressed)
              )}
            >
              <img src={PRODUCT_BLOG_ICON_IMG} alt="" className="h-[18px] w-[18px]" />
              Product blog
            </button>
            <button
              type="button"
              onMouseEnter={() => setFeedbackHovered(true)}
              onMouseLeave={() => { setFeedbackHovered(false); setFeedbackPressed(false); }}
              onMouseDown={() => setFeedbackPressed(true)}
              onMouseUp={() => setFeedbackPressed(false)}
              className={cn(
                "inline-flex h-8 w-[162px] items-center gap-1 rounded-lg border pl-2 pr-3 py-1.5 text-xs font-medium leading-5",
                feedbackHovered ? "text-[#71717a]" : "text-[#09090b]",
                getSecondaryButtonClasses(feedbackHovered, feedbackPressed)
              )}
            >
              <img src={FEEDBACK_ICON_IMG} alt="" className="h-[18px] w-[18px]" />
              Leave your feedback
            </button>
          </div>
        </footer>
      </div>

      {showSnack ? (
        <Snack
          type="success"
          message="Changes are saved!"
          onClose={() => setShowSnack(false)}
          className="absolute left-1/2 top-10 z-20 -translate-x-1/2"
        />
      ) : null}

      {error ? (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 rounded-lg border border-[#f0c3c6] bg-[#fff4f5] px-4 py-2 text-sm text-[#e31a24]">
          {error}
        </div>
      ) : null}
    </main>
  );
}
