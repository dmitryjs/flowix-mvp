"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabaseClient();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace("/login?error=auth_callback_failed");
            return;
          }
          router.replace("/");
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            router.replace("/login?error=auth_callback_failed");
            return;
          }
          router.replace("/");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/");
          return;
        }

        router.replace("/login?error=auth_callback_failed");
      } catch {
        router.replace("/login?error=auth_callback_failed");
      }
    };

    void handleCallback();
  }, [router]);

  return (
    <main>
      <h1>Auth callback</h1>
      <p>Signing you in...</p>
    </main>
  );
}
