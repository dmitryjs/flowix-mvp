"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";

const AUTH_COOKIE_NAME = "flowix-auth";

function setAuthCookie(isAuthorized: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  if (isAuthorized) {
    document.cookie = `${AUTH_COOKIE_NAME}=1; Path=/; SameSite=Lax`;
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function AuthSessionSync() {
  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setAuthCookie(Boolean(data.session));
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthCookie(Boolean(session));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
