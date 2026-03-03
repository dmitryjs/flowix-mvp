"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { PUBLIC_STORAGE_BUCKET } from "@/lib/env";

type Flow = {
  id: string;
  name: string;
};

type FlowStep = {
  id: string;
  step_index: number;
  url: string | null;
  screenshot_path: string | null;
};

export default function FlowPage() {
  const params = useParams<{ id: string }>();
  const flowId = params.id;
  const storageBucket = PUBLIC_STORAGE_BUCKET;

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadSignedUrls = async (stepsList: FlowStep[]) => {
    const supabase = getSupabaseClient();
    if (!storageBucket) {
      setSignedUrls({});
      return;
    }

    const urlEntries = await Promise.all(
      stepsList.map(async (step) => {
        if (!step.screenshot_path) {
          return [step.id, ""] as const;
        }

        const { data, error: signedUrlError } = await supabase.storage
          .from(storageBucket)
          .createSignedUrl(step.screenshot_path, 60 * 10);

        if (signedUrlError || !data?.signedUrl) {
          return [step.id, ""] as const;
        }

        return [step.id, data.signedUrl] as const;
      })
    );

    setSignedUrls(Object.fromEntries(urlEntries));
  };

  useEffect(() => {
    const loadFlow = async () => {
      const supabase = getSupabaseClient();
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

      const { data: stepsData, error: stepsError } = await supabase
        .from("flow_steps")
        .select("*")
        .eq("flow_id", flowId)
        .order("step_index", { ascending: true });

      if (stepsError) {
        setError(stepsError.message);
        setLoading(false);
        return;
      }

      const nextSteps = (stepsData ?? []) as FlowStep[];
      setSteps(nextSteps);
      await loadSignedUrls(nextSteps);
      setLoading(false);
    };

    void loadFlow();
  }, [flowId]);

  const refreshSteps = async () => {
    const supabase = getSupabaseClient();
    const { data: stepsData, error: stepsError } = await supabase
      .from("flow_steps")
      .select("*")
      .eq("flow_id", flowId)
      .order("step_index", { ascending: true });

    if (stepsError) {
      setError(stepsError.message);
      return;
    }

    const nextSteps = (stepsData ?? []) as FlowStep[];
    setSteps(nextSteps);
    await loadSignedUrls(nextSteps);
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadMessage(null);
    setError(null);
    const supabase = getSupabaseClient();

    if (!file) {
      setError("Choose a file");
      return;
    }

    if (!storageBucket) {
      setError("SUPABASE_STORAGE_BUCKET is not configured");
      return;
    }

    setUploading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message ?? "User not found");
      setUploading(false);
      return;
    }

    const path = `${user.id}/${flowId}/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("flow_steps").insert({
      flow_id: flowId,
      step_index: 0,
      url: window.location.href,
      screenshot_path: path,
      click_x: null,
      click_y: null,
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
    });

    if (insertError) {
      setError(insertError.message);
      setUploading(false);
      return;
    }

    setUploadMessage("Screenshot uploaded");
    setFile(null);
    await refreshSteps();
    setUploading(false);
  };

  return (
    <main>
      <h1>{flow ? flow.name : "Flow"}</h1>
      {error ? <p>{error}</p> : null}
      {loading ? <p>Loading flow...</p> : null}
      {!loading && !flow ? <p>Flow not found</p> : null}

      {!loading && flow ? (
        <section>
          <h2>Steps</h2>
          {steps.length === 0 ? <p>No steps yet</p> : null}
          {steps.length > 0 ? (
            <ul>
              {steps.map((step, index) => {
                const imageUrl = signedUrls[step.id];

                return (
                  <li key={step.id ?? `${step.step_index}-${index}`}>
                    <p>Step {index + 1}</p>
                    {imageUrl ? (
                      <img src={imageUrl} alt={`Step ${index + 1}`} />
                    ) : (
                      <p>Screenshot unavailable</p>
                    )}
                    <p>{step.url ?? "No URL"}</p>
                    {index < steps.length - 1 ? <hr /> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {!loading && flow ? (
        <section>
          <h2>Upload screenshot</h2>
          <form onSubmit={handleUpload}>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFile(event.target.files?.[0] ?? null)
              }
            />
            <button type="submit" disabled={uploading || !file}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
          {uploadMessage ? <p>{uploadMessage}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
