"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { PUBLIC_STORAGE_BUCKET } from "@/lib/env";
import { FlowCard, IconsFilled, IconsLight, ModalCreateProject, Overlay, Snack } from "@/ui-kit";

type Flow = {
  id: string;
  name: string;
  project_id: string;
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
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const flowId = params.id;
  const storageBucket = PUBLIC_STORAGE_BUCKET;

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);
  const [previewStepId, setPreviewStepId] = useState<string | null>(null);
  const [stepNames, setStepNames] = useState<Record<string, string>>({});
  const [editNameStepId, setEditNameStepId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editUrlStepId, setEditUrlStepId] = useState<string | null>(null);
  const [editUrlValue, setEditUrlValue] = useState("");
  const [backHovered, setBackHovered] = useState(false);
  const [backPressed, setBackPressed] = useState(false);
  const [shareHovered, setShareHovered] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [deletePressed, setDeletePressed] = useState(false);

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
        .select("id, name, project_id")
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

  const handleShareFlow = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setActionMessage("Flow link copied");
  };

  const handleDeleteFlow = async () => {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !flow) return;

    const { error: deleteError } = await supabase
      .from("flows")
      .delete()
      .eq("id", flow.id)
      .eq("owner_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.push(flow.project_id ? `/projects/${flow.project_id}` : "/");
  };

  const handleDeleteStep = async (stepId: string) => {
    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase.from("flow_steps").delete().eq("id", stepId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
    setActionMessage("Step deleted");
  };

  const handleSaveStepName = (stepId: string) => {
    const trimmed = editNameValue.trim();
    if (trimmed) {
      setStepNames((prev) => ({ ...prev, [stepId]: trimmed }));
    }
    setEditNameStepId(null);
    setEditNameValue("");
  };

  const handleSaveStepUrl = async (stepId: string) => {
    const trimmed = editUrlValue.trim();
    if (!trimmed) {
      setEditUrlStepId(null);
      return;
    }
    try {
      const res = await fetch(`/api/flows/${flowId}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (res.ok) {
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, url: trimmed } : s))
        );
        setActionMessage("URL updated");
      } else {
        const data = (await res.json()) as { error?: string };
        setError(typeof data.error === "string" ? data.error : "Failed to update URL");
      }
    } catch {
      setError("Failed to update URL");
    }
    setEditUrlStepId(null);
    setEditUrlValue("");
  };

  const getHeaderNeutralButtonClasses = (hovered: boolean, pressed: boolean) => {
    if (pressed) return "bg-[#cfd2d6]";
    if (hovered) return "bg-[#e4e5e7]";
    return "bg-[#eeeff0]";
  };

  const getHeaderTextButtonClasses = (hovered: boolean, pressed: boolean) => {
    if (pressed) return "bg-[#dfe2e6]";
    if (hovered) return "bg-[#eeeff0]";
    return "bg-transparent";
  };

  return (
    <main className="relative min-h-screen overflow-hidden rounded-[40px] bg-[#fafafa] p-7">
      <section className="mx-auto flex h-[1061px] w-full max-w-[1026px] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white">
        <header className="h-16 border-b border-[#dbdcdd] px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() =>
                  flow?.project_id ? router.push(`/projects/${flow.project_id}`) : router.back()
                }
                onMouseEnter={() => setBackHovered(true)}
                onMouseLeave={() => {
                  setBackHovered(false);
                  setBackPressed(false);
                }}
                onMouseDown={() => setBackPressed(true)}
                onMouseUp={() => setBackPressed(false)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${getHeaderNeutralButtonClasses(backHovered, backPressed)}`}
                aria-label="Back"
              >
                <IconsFilled icon="Back" className="h-[18px] w-[18px] text-[#09090b]" />
              </button>
              <h1 className="text-[20px] font-semibold leading-4 text-[#09090b]">
                {flow?.name ?? "Flow name"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOverlayEnabled((prev) => !prev)}
                className={`inline-flex h-8 items-center gap-1 rounded-lg pl-2 pr-3 py-1.5 text-[12px] font-medium leading-5 ${
                  overlayEnabled
                    ? "w-[111px] bg-[#2d4ffa] text-white"
                    : "w-[116px] bg-[#eeeff0] text-[#09090b]"
                }`}
              >
                <span
                  className={`relative inline-flex h-3 w-[18px] rounded-full ${
                    overlayEnabled ? "bg-[#8f9df4]" : "bg-[#8f9298]"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white ${
                      overlayEnabled ? "right-1" : "left-1"
                    }`}
                  />
                </span>
                {overlayEnabled ? "Overlay: ON" : "Overlay: OFF"}
              </button>
              <button
                type="button"
                onClick={() => void handleShareFlow()}
                onMouseEnter={() => setShareHovered(true)}
                onMouseLeave={() => {
                  setShareHovered(false);
                  setSharePressed(false);
                }}
                onMouseDown={() => setSharePressed(true)}
                onMouseUp={() => setSharePressed(false)}
                className={`inline-flex h-[30px] w-8 items-center justify-center rounded-lg ${getHeaderTextButtonClasses(shareHovered, sharePressed)}`}
                aria-label="Share flow"
              >
                <IconsLight icon="share" className="h-[18px] w-[18px] text-[#09090b]" />
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteFlow()}
                onMouseEnter={() => setDeleteHovered(true)}
                onMouseLeave={() => {
                  setDeleteHovered(false);
                  setDeletePressed(false);
                }}
                onMouseDown={() => setDeletePressed(true)}
                onMouseUp={() => setDeletePressed(false)}
                className={`inline-flex h-[30px] w-8 items-center justify-center rounded-lg ${getHeaderTextButtonClasses(deleteHovered, deletePressed)}`}
                aria-label="Delete flow"
              >
                <IconsLight icon="delete" className="h-[18px] w-[18px] text-[#e31a24]" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? <p className="text-sm text-[#71717a]">Loading flow...</p> : null}
          {!loading && !flow ? <p className="text-sm text-[#71717a]">Flow not found</p> : null}
          {!loading && flow && steps.length === 0 ? (
            <p className="text-sm text-[#71717a]">No steps yet</p>
          ) : null}

          {!loading && flow ? (
            <div className="flex flex-col items-center gap-4">
              {steps.map((step, index) => {
                const imageUrl = signedUrls[step.id];
                const hasClickPoint =
                  typeof step.click_x === "number" &&
                  typeof step.click_y === "number" &&
                  typeof step.viewport_w === "number" &&
                  typeof step.viewport_h === "number" &&
                  step.viewport_w > 0 &&
                  step.viewport_h > 0;
                const clickPoint = hasClickPoint
                  ? {
                      x: (step.click_x! / step.viewport_w!) * 100,
                      y: (step.click_y! / step.viewport_h!) * 100,
                    }
                  : null;

                return (
                  <div key={step.id} className="flex w-full max-w-[994px] flex-col items-center gap-4">
                    <div
                      onMouseEnter={() => setHoveredStepId(step.id)}
                      onMouseLeave={() => setHoveredStepId((prev) => (prev === step.id ? null : prev))}
                      className="w-full"
                    >
                      <FlowCard
                        title={stepNames[step.id] ?? `Step ${step.step_index + 1}`}
                        url={step.url ?? "No URL"}
                        imageSrc={imageUrl || ""}
                        imageAlt={`Step ${step.step_index + 1}`}
                        state={
                          hoveredStepId === step.id
                            ? "hover"
                            : overlayEnabled
                            ? "overlay"
                            : "default"
                        }
                        clickPoint={clickPoint}
                        onDelete={() => void handleDeleteStep(step.id)}
                        onCopy={async () => {
                          await navigator.clipboard.writeText(step.url ?? "");
                          setActionMessage("Step URL copied");
                        }}
                        onEdit={() => {
                          setEditNameStepId(step.id);
                          setEditNameValue(stepNames[step.id] ?? `Step ${step.step_index + 1}`);
                        }}
                        onEditUrl={() => {
                          setEditUrlStepId(step.id);
                          setEditUrlValue(step.url ?? "");
                        }}
                        onFullScreen={() => setPreviewStepId(step.id)}
                      />
                    </div>
                    {index < steps.length - 1 ? (
                      <div className="relative h-[46px] w-2">
                        <div className="absolute left-0 top-0 h-2 w-2 rounded-full border-2 border-[#2d4ffa] bg-white" />
                        <div className="absolute left-1/2 top-[8px] h-[38px] w-px -translate-x-1/2 bg-[#2d4ffa]" />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {previewStepId ? (
        <>
          <Overlay className="fixed inset-0 z-40 rounded-none" />
          <div className="fixed inset-[40px] z-50 flex flex-col">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewStepId(null)}
                className="inline-flex h-[30px] w-8 items-center justify-center rounded-lg bg-[#eeeff0]"
                aria-label="Close preview"
              >
                <IconsFilled icon="Close" className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden rounded-xl border border-[#dbdcdd] bg-white">
              {signedUrls[previewStepId] ? (
                <Image
                  src={signedUrls[previewStepId]}
                  alt="Screen preview"
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#71717a]">
                  Screenshot unavailable
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {editNameStepId ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditNameStepId(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
            <ModalCreateProject
              title="Change step name"
              projectName={editNameValue}
              projectNamePlaceholder="Step name"
              ctaLabel="Save"
              onProjectNameChange={setEditNameValue}
              onClose={() => setEditNameStepId(null)}
              onSubmit={() => handleSaveStepName(editNameStepId)}
            />
          </div>
        </>
      ) : null}

      {editUrlStepId ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditUrlStepId(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
            <ModalCreateProject
              title="Change step URL"
              projectName={editUrlValue}
              projectNamePlaceholder="https://example.com"
              ctaLabel="Save"
              onProjectNameChange={setEditUrlValue}
              onClose={() => setEditUrlStepId(null)}
              onSubmit={() => void handleSaveStepUrl(editUrlStepId)}
            />
          </div>
        </>
      ) : null}

      {error ? (
        <div className="absolute left-1/2 top-6 -translate-x-1/2">
          <Snack type="error" message={error} onClose={() => setError(null)} />
        </div>
      ) : null}
      {actionMessage ? (
        <div className="absolute left-1/2 top-6 -translate-x-1/2">
          <Snack type="success" message={actionMessage} onClose={() => setActionMessage(null)} />
        </div>
      ) : null}
    </main>
  );
}
