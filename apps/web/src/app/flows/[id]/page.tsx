"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { PUBLIC_STORAGE_BUCKET } from "@/lib/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Flow = {
  id: string;
  name: string;
};

type FlowStep = {
  id: string;
  step_index: number;
  url: string | null;
  screenshot_path: string | null;
  click_x: number | null;
  click_y: number | null;
  viewport_w: number | null;
  viewport_h: number | null;
};

export default function FlowPage() {
  const params = useParams<{ id: string }>();
  const flowId = params.id;
  const storageBucket = PUBLIC_STORAGE_BUCKET;

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadSignedUrls = useCallback(
    async (stepsList: FlowStep[]) => {
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
    },
    [storageBucket]
  );

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
  }, [flowId, loadSignedUrls]);

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{flow ? flow.name : "Flow"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading flow...</p>
          ) : null}
          {!loading && !flow ? <p className="text-sm">Flow not found</p> : null}
        </CardContent>
      </Card>

      {!loading && flow ? (
        <Card>
          <CardHeader>
            <CardTitle>Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No steps yet</p>
            ) : null}
            {steps.map((step) => {
              const imageUrl = signedUrls[step.id];
              const hasClickPoint =
                typeof step.click_x === "number" &&
                typeof step.click_y === "number" &&
                typeof step.viewport_w === "number" &&
                typeof step.viewport_h === "number" &&
                step.viewport_w > 0 &&
                step.viewport_h > 0;
              const clickLeft = hasClickPoint
                ? `${(step.click_x! / step.viewport_w!) * 100}%`
                : "0%";
              const clickTop = hasClickPoint
                ? `${(step.click_y! / step.viewport_h!) * 100}%`
                : "0%";

              return (
                <div key={step.id} className="rounded-md border p-3">
                  <p className="mb-2 text-sm font-medium">
                    Step {step.step_index + 1}
                  </p>
                  {imageUrl ? (
                    <div className="relative overflow-hidden rounded-md border">
                      <Image
                        src={imageUrl}
                        alt={`Step ${step.step_index + 1}`}
                        width={1280}
                        height={720}
                        unoptimized
                        className="h-auto w-full"
                      />
                      {hasClickPoint ? (
                        <span
                          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-red-500 shadow"
                          style={{ left: clickLeft, top: clickTop }}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Screenshot unavailable
                    </p>
                  )}
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {step.url ?? "No URL"}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
