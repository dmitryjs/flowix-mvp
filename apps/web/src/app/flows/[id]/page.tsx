"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Flow = {
  id: string;
  name: string;
};

export default function FlowPage() {
  const params = useParams<{ id: string }>();
  const flowId = params.id;

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlow = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message ?? "User not found");
        setLoading(false);
        return;
      }

      const { data, error: flowError } = await supabase
        .from("flows")
        .select("id, name")
        .eq("id", flowId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (flowError) {
        setError(flowError.message);
        setLoading(false);
        return;
      }

      setFlow((data as Flow | null) ?? null);
      setLoading(false);
    };

    void loadFlow();
  }, [flowId]);

  return (
    <main>
      <h1>{flow ? flow.name : "Flow"}</h1>
      {error ? <p>{error}</p> : null}
      {loading ? <p>Loading flow...</p> : null}
      {!loading && !flow ? <p>Flow not found</p> : null}

      {!loading && flow ? (
        <section>
          <h2>Steps</h2>
          <p>No steps yet</p>
        </section>
      ) : null}
    </main>
  );
}
