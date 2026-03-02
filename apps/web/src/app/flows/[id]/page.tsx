"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Flow = {
  id: string;
  name: string;
};

export default function FlowPage() {
  const params = useParams<{ id: string }>();
  const flowId = params.id;
  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
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

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadMessage(null);
    setError(null);

    if (!file) {
      setError("Choose a file");
      return;
    }

    if (!storageBucket) {
      setError("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET is not configured");
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
          <p>No steps yet</p>
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
