"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { IconsFilled, IconsLight, ModalCreateProject, Overlay, TableProjectRow } from "@/ui-kit";

type Flow = {
  id: string;
  name: string;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
};

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [stepCountsByFlowId, setStepCountsByFlowId] = useState<Record<string, number>>({});
  const [newFlowName, setNewFlowName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateFlowOpen, setIsCreateFlowOpen] = useState(false);
  const [openedFlowMenuId, setOpenedFlowMenuId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [blogHovered, setBlogHovered] = useState(false);
  const [blogPressed, setBlogPressed] = useState(false);
  const [feedbackHovered, setFeedbackHovered] = useState(false);
  const [feedbackPressed, setFeedbackPressed] = useState(false);
  const [backHovered, setBackHovered] = useState(false);
  const [backPressed, setBackPressed] = useState(false);
  const [createHovered, setCreateHovered] = useState(false);
  const [createPressed, setCreatePressed] = useState(false);
  const [shareHovered, setShareHovered] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const [deletePressed, setDeletePressed] = useState(false);

  const PRODUCT_BLOG_ICON_IMG =
    "https://www.figma.com/api/mcp/asset/e196d238-6d56-49e0-afc8-2f42c3dcbef0";
  const FEEDBACK_ICON_IMG =
    "https://www.figma.com/api/mcp/asset/4a53988d-c4e7-4152-9dd8-923d2b1b6983";

  useEffect(() => {
    const loadProjectData = async () => {
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

      setUserId(user.id);

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (projectError) {
        setError(projectError.message);
        setLoading(false);
        return;
      }

      setProject((projectData as Project | null) ?? null);

      const { data: flowsData, error: flowsError } = await supabase
        .from("flows")
        .select("id, name, created_at")
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (flowsError) {
        setError(flowsError.message);
        setLoading(false);
        return;
      }

      const nextFlows = (flowsData ?? []) as Flow[];
      setFlows(nextFlows);

      if (nextFlows.length > 0) {
        const flowIds = nextFlows.map((flow) => flow.id);
        const { data: stepsData, error: stepsError } = await supabase
          .from("flow_steps")
          .select("id, flow_id")
          .in("flow_id", flowIds);

        if (stepsError) {
          setError(stepsError.message);
          setLoading(false);
          return;
        }

        const counts = (stepsData ?? []).reduce<Record<string, number>>((acc, row) => {
          const flowRef = row.flow_id as string | null;
          if (!flowRef) return acc;
          acc[flowRef] = (acc[flowRef] ?? 0) + 1;
          return acc;
        }, {});

        setStepCountsByFlowId(counts);
      } else {
        setStepCountsByFlowId({});
      }
      setLoading(false);
    };

    void loadProjectData();
  }, [projectId]);

  const createFlow = async () => {
    if (!userId || !newFlowName.trim()) return;
    const supabase = getSupabaseClient();

    setCreating(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("flows")
      .insert({
        name: newFlowName.trim(),
        project_id: projectId,
        owner_id: userId,
      })
      .select("id, name, created_at")
      .single();

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    if (data) {
      const flow = data as Flow;
      setFlows((prev) => [flow, ...prev]);
      setStepCountsByFlowId((prev) => ({ ...prev, [flow.id]: 0 }));
      setNewFlowName("");
      setIsCreateFlowOpen(false);
      setActionMessage("Flow created");
    }

    setCreating(false);
  };

  const handleCreateFlow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void createFlow();
  };

  const handleShareFlow = async (flowId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/flows/${flowId}`);
    setActionMessage("Flow link copied");
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    setError(null);
    setActionMessage(null);
    const { error: deleteError } = await supabase
      .from("flows")
      .delete()
      .eq("id", flowId)
      .eq("owner_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setFlows((prev) => prev.filter((flow) => flow.id !== flowId));
    setStepCountsByFlowId((prev) => {
      const next = { ...prev };
      delete next[flowId];
      return next;
    });
    setOpenedFlowMenuId((prev) => (prev === flowId ? null : prev));
    setActionMessage("Flow deleted");
  };

  const formatCreatedLabel = (createdAt: string) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "Created -";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `Created ${day}.${month}.${year}`;
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

  const getHeaderTextButtonClasses = (hovered: boolean, pressed: boolean) => {
    if (pressed) return "bg-[#dfe2e6]";
    if (hovered) return "bg-[#eeeff0]";
    return "bg-transparent";
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
                onMouseLeave={() => {
                  setBackHovered(false);
                  setBackPressed(false);
                }}
                onMouseDown={() => setBackPressed(true)}
                onMouseUp={() => setBackPressed(false)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#09090b] ${getHeaderNeutralButtonClasses(backHovered, backPressed)}`}
                aria-label="Back to projects"
              >
                <IconsFilled icon="Back" className="h-[18px] w-[18px]" />
              </button>
              <h1 className="text-[20px] font-semibold leading-4 text-[#09090b]">
                {project?.name ?? "Project name"}
              </h1>
            </div>
            <div className="flex h-[30px] items-center gap-1">
              <button
                type="button"
                onClick={() => setIsCreateFlowOpen(true)}
                onMouseEnter={() => setCreateHovered(true)}
                onMouseLeave={() => {
                  setCreateHovered(false);
                  setCreatePressed(false);
                }}
                onMouseDown={() => setCreatePressed(true)}
                onMouseUp={() => setCreatePressed(false)}
                className={`inline-flex h-[30px] w-8 items-center justify-center rounded-lg text-[#09090b] ${getHeaderTextButtonClasses(createHovered, createPressed)}`}
                aria-label="Create flow"
              >
                <IconsLight icon="edit" className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onMouseEnter={() => setShareHovered(true)}
                onMouseLeave={() => {
                  setShareHovered(false);
                  setSharePressed(false);
                }}
                onMouseDown={() => setSharePressed(true)}
                onMouseUp={() => setSharePressed(false)}
                className={`inline-flex h-[30px] w-8 items-center justify-center rounded-lg text-[#09090b] ${getHeaderTextButtonClasses(shareHovered, sharePressed)}`}
                aria-label="Project action"
              >
                <IconsLight icon="share" className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onMouseEnter={() => setDeleteHovered(true)}
                onMouseLeave={() => {
                  setDeleteHovered(false);
                  setDeletePressed(false);
                }}
                onMouseDown={() => setDeletePressed(true)}
                onMouseUp={() => setDeletePressed(false)}
                className={`inline-flex h-[30px] w-8 items-center justify-center rounded-lg text-[#e31a24] ${getHeaderTextButtonClasses(deleteHovered, deletePressed)}`}
                aria-label="Project action"
              >
                <IconsLight icon="delete" className="h-[18px] w-[18px] text-[#e31a24]" />
              </button>
            </div>
          </header>

          <div className="min-h-[408px]">
            {loading ? (
              <div className="flex min-h-[408px] items-center justify-center">
                <p className="text-sm text-[#71717a]">Loading project...</p>
              </div>
            ) : null}
            {!loading && !project ? (
              <div className="flex min-h-[408px] items-center justify-center">
                <p className="text-sm text-[#71717a]">Project not found</p>
              </div>
            ) : null}
            {!loading && project && flows.length === 0 ? (
              <div className="flex min-h-[408px] items-center justify-center">
                <p className="text-sm text-[#71717a]">No flows yet</p>
              </div>
            ) : null}
            {!loading && project && flows.length > 0 ? (
              <div className="w-full">
                {flows.map((flow) => (
                  <TableProjectRow
                    key={flow.id}
                    state={openedFlowMenuId === flow.id ? "opened menu" : "default"}
                    projectName={flow.name}
                    leadingIcon="docs"
                    createdAtLabel={formatCreatedLabel(flow.created_at)}
                    screensLabel={`${stepCountsByFlowId[flow.id] ?? 0} screens`}
                    onOpenProject={() => window.location.assign(`/flows/${flow.id}`)}
                    onOpenMenu={() =>
                      setOpenedFlowMenuId((prev) => (prev === flow.id ? null : flow.id))
                    }
                    onShare={() => void handleShareFlow(flow.id)}
                    onDelete={() => void handleDeleteFlow(flow.id)}
                    onRename={() => setActionMessage("Rename is not implemented yet")}
                  />
                ))}
              </div>
            ) : null}
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
              onMouseLeave={() => {
                setBlogHovered(false);
                setBlogPressed(false);
              }}
              onMouseDown={() => setBlogPressed(true)}
              onMouseUp={() => setBlogPressed(false)}
              className={`inline-flex h-8 w-[116px] items-center gap-1 rounded-lg border pl-2 pr-3 py-1.5 text-xs font-medium leading-5 ${
                blogHovered ? "text-[#71717a]" : "text-[#09090b]"
              } ${getSecondaryButtonClasses(blogHovered, blogPressed)}`}
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
              } ${getSecondaryButtonClasses(feedbackHovered, feedbackPressed)}`}
            >
              <img src={FEEDBACK_ICON_IMG} alt="" className="h-[18px] w-[18px]" />
              Leave your feedback
            </button>
          </div>
        </footer>
      </div>

      {isCreateFlowOpen ? (
        <>
          <Overlay />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <form onSubmit={handleCreateFlow}>
              <ModalCreateProject
                title="Create flow"
                projectName={newFlowName}
                projectNamePlaceholder="Flow name"
                ctaLabel={creating ? "Creating..." : "Create flow"}
                onProjectNameChange={setNewFlowName}
                onClose={() => {
                  setIsCreateFlowOpen(false);
                  setNewFlowName("");
                }}
                onSubmit={() => void createFlow()}
                className="shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)]"
              />
            </form>
          </div>
        </>
      ) : null}

      {error ? (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 rounded-lg border border-[#f0c3c6] bg-[#fff4f5] px-4 py-2 text-sm text-[#e31a24]">
          {error}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 rounded-lg border border-[#d7e5d4] bg-[#f2fff0] px-4 py-2 text-sm text-[#2f7d33]">
          {actionMessage}
        </div>
      ) : null}
    </main>
  );
}
