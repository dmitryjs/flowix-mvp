"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { CreditCardIcon, LogOutIcon, UserIcon } from "lucide-react";
import {
  ButtonFigma,
  ModalDeleteProject,
  FlowixLogo,
  ModalCreateProject,
  Overlay,
  Snack,
  TableProjectRow,
} from "@/ui-kit";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  created_at: string;
};

export default function ProjectsDashboardPage() {
  const router = useRouter();
  const PRODUCT_BLOG_ICON_IMG =
    "https://www.figma.com/api/mcp/asset/e196d238-6d56-49e0-afc8-2f42c3dcbef0";
  const FEEDBACK_ICON_IMG =
    "https://www.figma.com/api/mcp/asset/4a53988d-c4e7-4152-9dd8-923d2b1b6983";

  const [projects, setProjects] = useState<Project[]>([]);
  const [flowCountsByProjectId, setFlowCountsByProjectId] = useState<Record<string, number>>({});
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isRenameProjectOpen, setIsRenameProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [openedProjectMenuId, setOpenedProjectMenuId] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renamingProjectName, setRenamingProjectName] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deletingProjectName, setDeletingProjectName] = useState("");
  const [deletingProject, setDeletingProject] = useState(false);
  const [showShareSnack, setShowShareSnack] = useState(false);
  const [showRenameSnack, setShowRenameSnack] = useState(false);
  const [showDeleteSnack, setShowDeleteSnack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [blogHovered, setBlogHovered] = useState(false);
  const [blogPressed, setBlogPressed] = useState(false);
  const [feedbackHovered, setFeedbackHovered] = useState(false);
  const [feedbackPressed, setFeedbackPressed] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      const supabase = getSupabaseClient();
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message ?? "You are not authorized.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);
      setUserAvatarUrl((user.user_metadata?.avatar_url as string | undefined) ?? null);

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        setError(projectsError.message);
        setLoading(false);
        return;
      }

      const normalizedProjects = (projectsData ?? []) as Project[];
      setProjects(normalizedProjects);

      const { data: flowRows, error: flowsError } = await supabase
        .from("flows")
        .select("id, project_id")
        .eq("owner_id", user.id);

      if (flowsError) {
        setError(flowsError.message);
        setLoading(false);
        return;
      }

      const counts = (flowRows ?? []).reduce<Record<string, number>>((acc, row) => {
        const projectId = row.project_id as string | null;
        if (!projectId) return acc;
        acc[projectId] = (acc[projectId] ?? 0) + 1;
        return acc;
      }, {});

      setFlowCountsByProjectId(counts);
      setLoading(false);
    };

    void loadProjects();
  }, []);

  const createProject = async () => {
    if (!userId || !newProjectName.trim()) return;
    const supabase = getSupabaseClient();

    setCreating(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: newProjectName.trim(),
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
      setProjects((prev) => [data as Project, ...prev]);
      setFlowCountsByProjectId((prev) => ({ ...prev, [(data as Project).id]: 0 }));
      setNewProjectName("");
      setIsCreateProjectOpen(false);
      setActionMessage("Project created");
    }

    setCreating(false);
  };

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void createProject();
  };

  const openRenameProjectModal = (projectId: string, projectName: string) => {
    setOpenedProjectMenuId(null);
    setRenamingProjectId(projectId);
    setRenamingProjectName(projectName);
    setIsRenameProjectOpen(true);
  };

  const renameProject = async () => {
    if (!userId || !renamingProjectId || !renamingProjectName.trim()) return;
    const supabase = getSupabaseClient();
    setRenaming(true);
    setError(null);

    const nextName = renamingProjectName.trim();
    const { error: updateError } = await supabase
      .from("projects")
      .update({ name: nextName })
      .eq("id", renamingProjectId)
      .eq("owner_id", userId);

    if (updateError) {
      setError(updateError.message);
      setRenaming(false);
      return;
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === renamingProjectId ? { ...project, name: nextName } : project
      )
    );
    setIsRenameProjectOpen(false);
    setShowRenameSnack(true);
    window.setTimeout(() => setShowRenameSnack(false), 2000);
    setRenamingProjectId(null);
    setRenamingProjectName("");
    setRenaming(false);
  };

  const handleRenameProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void renameProject();
  };

  const handleShareProject = async (projectId: string) => {
    setOpenedProjectMenuId(null);
    await navigator.clipboard.writeText(`${window.location.origin}/projects/${projectId}`);
    setShowShareSnack(true);
    window.setTimeout(() => setShowShareSnack(false), 1800);
  };

  const openDeleteProjectModal = (projectId: string, projectName: string) => {
    setOpenedProjectMenuId(null);
    setDeletingProjectId(projectId);
    setDeletingProjectName(projectName);
    setIsDeleteProjectOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!userId || !deletingProjectId) return;
    const supabase = getSupabaseClient();
    setDeletingProject(true);
    setError(null);
    setActionMessage(null);
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", deletingProjectId)
      .eq("owner_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingProject(false);
      return;
    }

    setProjects((prev) => prev.filter((project) => project.id !== deletingProjectId));
    setFlowCountsByProjectId((prev) => {
      const next = { ...prev };
      delete next[deletingProjectId];
      return next;
    });
    setIsDeleteProjectOpen(false);
    setDeletingProjectId(null);
    setDeletingProjectName("");
    setDeletingProject(false);
    setShowDeleteSnack(true);
    window.setTimeout(() => setShowDeleteSnack(false), 2000);
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  const avatarLabel = userEmail?.trim().charAt(0).toUpperCase() || "U";

  const formatCreatedLabel = (createdAt: string) => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "Created -";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `Created ${day}.${month}.${year}`;
  };

  const getSecondaryButtonClasses = (hovered: boolean, pressed: boolean) => {
    if (pressed) {
      return "border-[#cfd2d6] bg-transparent";
    }
    if (hovered) {
      return "border-[#dbdcdd] bg-transparent";
    }
    return "border-[#dbdcdd] bg-transparent";
  };

  return (
    <main className="relative min-h-screen overflow-hidden rounded-[40px] bg-[#fafafa]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1728px] flex-col items-center px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative w-full max-w-[800px] overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white">
          <header className="flex items-center justify-between border-b border-[#e4e4e7] px-6 py-5">
            <FlowixLogo />
            <div className="flex items-center gap-4">
              <ButtonFigma
                buttonType="Primary"
                size="s"
                content="❖ Label"
                label="New project"
                onClick={() => setIsCreateProjectOpen(true)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full",
                      "bg-[#e3e3ff] text-base font-normal text-[#4d4dff]"
                    )}
                    aria-label="Open profile menu"
                  >
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt="Profile avatar"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      avatarLabel
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[214px] p-1.5">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1.5 h-[60px]">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3e3ff] text-sm font-normal text-[#4d4dff]">
                      {userAvatarUrl ? (
                        <img src={userAvatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        avatarLabel
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <p className="truncate text-sm font-medium text-[#09090b]">
                        {userEmail?.split("@")[0] ?? "User"}
                      </p>
                      <p className="truncate text-xs text-[#71717a]">{userEmail ?? ""}</p>
                    </div>
                  </div>
                  <DropdownMenuItem
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[#09090b] hover:bg-[#eeeff0]"
                    onClick={() => router.push("/profile")}
                  >
                    <UserIcon className="h-4 w-4 shrink-0" />
                    My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[#09090b] hover:bg-[#eeeff0]">
                    <CreditCardIcon className="h-4 w-4 shrink-0" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[#09090b] hover:bg-[#eeeff0]"
                    onClick={handleLogout}
                  >
                    <LogOutIcon className="h-4 w-4 shrink-0" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="relative min-h-[408px]">
            {loading ? (
              <div className="flex min-h-[408px] items-center justify-center">
                <p className="text-sm text-[#71717a]">Loading projects...</p>
              </div>
            ) : null}

            {!loading && projects.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex w-[244px] flex-col items-center gap-4">
                  <div className="flex w-full flex-col items-center gap-0.5 text-center">
                    <h2 className="w-full text-base font-semibold text-[#09090b]">Empty :(</h2>
                    <p className="w-full text-sm text-[#71717a]">
                      You don`t have any created project yet
                    </p>
                  </div>
                  <ButtonFigma
                    buttonType="Primary"
                    size="s"
                    content="Label"
                    label="Create first project"
                    onClick={() => setIsCreateProjectOpen(true)}
                  />
                </div>
              </div>
            ) : null}

            {!loading && projects.length > 0 ? (
              <div className="w-full">
                {projects.map((project) => (
                  <TableProjectRow
                    key={project.id}
                    state={openedProjectMenuId === project.id ? "opened menu" : "default"}
                    projectName={project.name}
                    createdAtLabel={formatCreatedLabel(project.created_at)}
                    screensLabel={`${flowCountsByProjectId[project.id] ?? 0} screens`}
                    onOpenProject={() => window.location.assign(`/projects/${project.id}`)}
                    onOpenMenu={() =>
                      setOpenedProjectMenuId((prev) => (prev === project.id ? null : project.id))
                    }
                    onShare={() => void handleShareProject(project.id)}
                    onDelete={() => openDeleteProjectModal(project.id, project.name)}
                    onRename={() => openRenameProjectModal(project.id, project.name)}
                    className="cursor-default"
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

      {isCreateProjectOpen ? (
        <>
          <Overlay />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <form onSubmit={handleCreateProject}>
              <ModalCreateProject
                projectName={newProjectName}
                onProjectNameChange={setNewProjectName}
                ctaLabel={creating ? "Creating..." : "Create project"}
                onClose={() => {
                  setIsCreateProjectOpen(false);
                  setNewProjectName("");
                }}
                onSubmit={() => void createProject()}
                className="shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)]"
              />
            </form>
          </div>
        </>
      ) : null}

      {isRenameProjectOpen ? (
        <>
          <Overlay />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <form onSubmit={handleRenameProject}>
              <ModalCreateProject
                title="Change name"
                projectName={renamingProjectName}
                projectNamePlaceholder="Project name"
                ctaLabel={renaming ? "Saving..." : "Save changes"}
                onProjectNameChange={setRenamingProjectName}
                onClose={() => {
                  setIsRenameProjectOpen(false);
                  setRenamingProjectId(null);
                  setRenamingProjectName("");
                }}
                onSubmit={() => void renameProject()}
                className="shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)]"
              />
            </form>
          </div>
        </>
      ) : null}

      {isDeleteProjectOpen ? (
        <>
          <Overlay />
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <ModalDeleteProject
              deleting={deletingProject}
              onDelete={() => void handleDeleteProject()}
              onClose={() => {
                setIsDeleteProjectOpen(false);
                setDeletingProjectId(null);
                setDeletingProjectName("");
                setDeletingProject(false);
              }}
              className="shadow-[0px_4px_8px_0px_rgba(0,0,0,0.12)]"
            />
          </div>
        </>
      ) : null}

      {showShareSnack ? (
        <Snack
          type="success"
          message="Link copied"
          onClose={() => setShowShareSnack(false)}
          className="absolute left-1/2 top-10 z-20 -translate-x-1/2"
        />
      ) : null}

      {showRenameSnack ? (
        <Snack
          type="success"
          message="Changes are saved!"
          onClose={() => setShowRenameSnack(false)}
          className="absolute left-1/2 top-10 z-20 -translate-x-1/2"
        />
      ) : null}

      {showDeleteSnack ? (
        <Snack
          type="success"
          message="Project deleted"
          onClose={() => setShowDeleteSnack(false)}
          className="absolute left-1/2 top-10 z-20 -translate-x-1/2"
        />
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
