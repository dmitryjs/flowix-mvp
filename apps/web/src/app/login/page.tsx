"use client";

import { FormEvent, useEffect, useState } from "react";
import Lottie from "lottie-react";
import { getSupabaseClient } from "@/lib/supabase";
import { CheckIcon, MailOpenIcon } from "lucide-react";
import { ButtonFigma, FlowixLogo, IconsLight } from "@/ui-kit";
import type { FigmaButtonState } from "@/ui-kit";

export default function LoginPage() {
  const SENT_EMAIL_STORAGE_KEY = "flowix-login-sent-email";
  const FLOW_RECORED_IMG =
    "https://www.figma.com/api/mcp/asset/4ee741c3-6580-4bd8-b410-b6190ef52caf";
  const PRODUCT_BLOG_ICON_IMG =
    "https://www.figma.com/api/mcp/asset/e196d238-6d56-49e0-afc8-2f42c3dcbef0";
  const FEEDBACK_ICON_IMG =
    "https://www.figma.com/api/mcp/asset/4a53988d-c4e7-4152-9dd8-923d2b1b6983";

  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(SENT_EMAIL_STORAGE_KEY);
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailOpenAnimation, setEmailOpenAnimation] = useState<object | null>(null);
  const [inputHovered, setInputHovered] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(false);
  const [blogHovered, setBlogHovered] = useState(false);
  const [blogPressed, setBlogPressed] = useState(false);
  const [feedbackHovered, setFeedbackHovered] = useState(false);
  const [feedbackPressed, setFeedbackPressed] = useState(false);

  const hasInputError = Boolean(error);
  const hasInputValue = email.trim().length > 0;

  const inputState = (() => {
    if (hasInputError && hasInputValue) return "errorFilled";
    if (hasInputError) return "error";
    if (inputFocused && hasInputValue) return "typing";
    if (inputFocused) return "focus";
    if (inputHovered) return "hover";
    if (hasInputValue) return "filled";
    return "default";
  })();
  const showFloatingLabel =
    inputState === "focus" ||
    inputState === "typing" ||
    inputState === "filled" ||
    inputState === "errorFilled" ||
    (inputState === "hover" && hasInputValue);

  const buttonState: FigmaButtonState = loading
    ? "Loader"
    : buttonPressed
    ? "Clicked"
    : buttonHovered || buttonFocused
    ? "Hover"
    : "Default";

  const getSecondaryButtonClasses = (hovered: boolean, pressed: boolean) => {
    if (pressed) {
      return "border-[#cfd2d6] bg-transparent";
    }
    if (hovered) {
      return "border-[#dbdcdd] bg-transparent";
    }
    return "border-[#dbdcdd] bg-transparent";
  };

  useEffect(() => {
    let cancelled = false;

    const loadAnimation = async () => {
      try {
        const response = await fetch("/animations/email-open-3.json");
        if (!response.ok) return;
        const data = (await response.json()) as object;
        if (!cancelled) {
          setEmailOpenAnimation(data);
        }
      } catch {
        // Fallback to static icon when animation file is unavailable.
      }
    };

    void loadAnimation();

    return () => {
      cancelled = true;
    };
  }, []);

  const sendMagicLink = async (targetEmail: string) => {
    if (!targetEmail) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setSentEmail(targetEmail);
    window.sessionStorage.setItem(SENT_EMAIL_STORAGE_KEY, targetEmail);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMagicLink(email.trim());
  };

  const handleResend = async () => {
    if (!sentEmail) return;
    await sendMagicLink(sentEmail);
  };

  return (
    <main className="min-h-screen overflow-hidden rounded-[40px] bg-[#fafafa]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1728px] flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="mt-6 flex w-[90px] flex-col items-center sm:mt-12">
          <FlowixLogo />
          <img
            src={FLOW_RECORED_IMG}
            alt="flow recored"
            className="mt-[5.46px] h-[8.54px] w-[68px]"
          />
        </div>

        <div className="flex w-full flex-1 items-center justify-center">
          {sentEmail ? (
            <section className="flex w-full max-w-[396px] flex-col items-center gap-5">
              {emailOpenAnimation ? (
                <div className="h-8 w-8">
                  <Lottie animationData={emailOpenAnimation} loop={false} autoplay />
                </div>
              ) : (
                <MailOpenIcon className="h-8 w-8 text-[#09090b]" />
              )}
              <div className="flex w-full flex-col items-center gap-6">
                <div className="flex w-full flex-col items-center gap-2 text-center">
                  <h1
                    className="w-full text-base font-semibold leading-5 text-[#09090b]"
                    style={{
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                    }}
                  >
                    Check your email
                  </h1>
                  <p className="w-full text-sm leading-[1.4] text-[#09090b]">
                    We&apos;ve sent you a magic link to {sentEmail}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResend}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-[#eeeff0] pl-2 pr-3 py-1.5 text-xs font-medium text-[#09090b] disabled:opacity-60"
                >
                  <IconsLight icon="repeat" className="h-[18px] w-[18px]" />
                  {loading ? "Sending..." : "Send again"}
                </button>
              </div>
            </section>
          ) : (
            <section className="flex w-full max-w-[396px] flex-col items-center gap-6">
              <div className="flex w-full flex-col items-start gap-6">
                <div className="flex w-full flex-col items-center gap-2 text-center">
                  <h1
                    className="w-full text-base font-semibold leading-5 text-[#09090b]"
                    style={{
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                    }}
                  >
                    Authorization
                  </h1>
                  <p
                    className="w-full text-sm leading-[1.4] text-[#71717a]"
                    style={{
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                      letterSpacing: "0.3px",
                    }}
                  >
                    Please enter your email address and we will send you a magic link for
                    authorization
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2.5">
                  <div
                    className={`relative h-11 w-full rounded-lg border ${
                      inputState === "hover"
                        ? "border-transparent bg-[#e8e8ea]"
                        : inputState === "error"
                        ? "border-[#e31a24] bg-[#e8e8ea]"
                        : inputState === "errorFilled"
                        ? "border-[#e31a24] bg-[#ecedee]"
                        : inputState === "focus" || inputState === "typing"
                        ? "border-[#2d4ffa] bg-[#ecedee]"
                        : "border-transparent bg-[#ecedee]"
                    }`}
                    onMouseEnter={() => setInputHovered(true)}
                    onMouseLeave={() => setInputHovered(false)}
                  >
                    {showFloatingLabel ? (
                      <label
                        htmlFor="email"
                        className="pointer-events-none absolute left-4 top-1 text-[10px] leading-[14px] tracking-[0.1px] text-[#8a8d94]"
                      >
                        Email
                      </label>
                    ) : null}
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError(null);
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder="Email"
                      className={`h-full w-full bg-transparent px-4 text-sm leading-5 text-[#09090b] outline-none ${
                        showFloatingLabel
                          ? "pb-1 pt-4 placeholder:text-transparent"
                          : "placeholder:text-[#8a8d94]"
                      }`}
                    />
                  </div>
                  <ButtonFigma
                    buttonType="Primary"
                    size="m"
                    content="Label"
                    state={buttonState}
                    label={loading ? "Sending..." : "Send magic link"}
                    nativeType="submit"
                    disabled={loading}
                    onMouseEnter={() => setButtonHovered(true)}
                    onMouseLeave={() => {
                      setButtonHovered(false);
                      setButtonPressed(false);
                    }}
                    onMouseDown={() => setButtonPressed(true)}
                    onMouseUp={() => setButtonPressed(false)}
                    onFocus={() => setButtonFocused(true)}
                    onBlur={() => {
                      setButtonFocused(false);
                      setButtonPressed(false);
                    }}
                    className="w-full"
                  />
                </form>
              </div>

              <button
                type="button"
                onClick={() => setRememberMe((prev) => !prev)}
                className="inline-flex items-center gap-2 text-sm text-[#09090b]"
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                    rememberMe
                      ? "border-[#2d4ffa] bg-[#2d4ffa] text-white"
                      : "border-[#dbdcdd] bg-[#eeeff0] text-transparent"
                  }`}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                Remember me on this device
              </button>
            </section>
          )}
        </div>

        {error ? <p className="mb-3 text-sm text-[#e31a24]">{error}</p> : <div />}

        <footer className="mt-4 flex flex-wrap items-center justify-center gap-[15px]">
          <div className="rounded-lg border border-[#dbdcdd] px-3 py-2 text-xs font-medium text-[#09090b]">
            v 1.0
          </div>
          <div className="h-5 w-px bg-[#dbdcdd]" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseEnter={() => setBlogHovered(true)}
              onMouseLeave={() => {
                setBlogHovered(false);
                setBlogPressed(false);
              }}
              onMouseDown={() => setBlogPressed(true)}
              onMouseUp={() => setBlogPressed(false)}
              className={`inline-flex h-8 w-[116px] items-center gap-1 rounded-lg border pl-2 pr-3 py-1.5 text-xs font-medium leading-5 ${
                blogHovered ? "text-[#71717a]" : "text-[#09090b]"
              } ${getSecondaryButtonClasses(
                blogHovered,
                blogPressed
              )}`}
            >
              <img src={PRODUCT_BLOG_ICON_IMG} alt="" className="h-[18px] w-[18px]" />
              Product blog
            </button>
            <button
              type="button"
              onMouseEnter={() => setFeedbackHovered(true)}
              onMouseLeave={() => {
                setFeedbackHovered(false);
                setFeedbackPressed(false);
              }}
              onMouseDown={() => setFeedbackPressed(true)}
              onMouseUp={() => setFeedbackPressed(false)}
              className={`inline-flex h-8 w-[162px] items-center gap-1 rounded-lg border pl-2 pr-3 py-1.5 text-xs font-medium leading-5 ${
                feedbackHovered ? "text-[#71717a]" : "text-[#09090b]"
              } ${getSecondaryButtonClasses(
                feedbackHovered,
                feedbackPressed
              )}`}
            >
              <img src={FEEDBACK_ICON_IMG} alt="" className="h-[18px] w-[18px]" />
              Leave your feedback
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
