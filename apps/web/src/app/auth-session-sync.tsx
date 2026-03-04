"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const AUTH_COOKIE_NAME = "flowix-auth";
const ACCESS_TOKEN_COOKIE_NAME = "flowix-access-token";

function setAuthCookies(session: { access_token?: string } | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (session?.access_token) {
    document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; SameSite=Lax`;
    document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(
      session.access_token
    )}; Path=/; SameSite=Lax`;
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function AuthSessionSync() {
  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setAuthCookies(data.session);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthCookies(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
