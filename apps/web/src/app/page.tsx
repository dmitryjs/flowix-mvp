"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, MoreHorizontalIcon, Share2Icon, Trash2Icon } from "lucide-react";

type Project = {
  id: string;
  name: string;
};

export default function ProjectsDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
        setError(userError?.message ?? "User not found");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data, error: projectsError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("owner_id", user.id)
        .order("name", { ascending: true });

      if (projectsError) {
        setError(projectsError.message);
        setLoading(false);
        return;
      }

      setProjects((data ?? []) as Project[]);
      setLoading(false);
    };

    void loadProjects();
  }, []);

  const handleCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      .select("id, name")
      .single();

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    if (data) {
      setProjects((prev) => [...prev, data as Project]);
      setNewProjectName("");
    }

    setCreating(false);
  };

  const handleShareProject = async (projectId: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/projects/${projectId}`
    );
    setActionMessage("Project link copied");
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    setError(null);
    setActionMessage(null);
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("owner_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setActionMessage("Project deleted");
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  };

  const avatarLabel = userEmail?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="border-gray-200 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Projects</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="Open user menu">
                  <Avatar>
                    <AvatarFallback>{avatarLabel}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateProject} className="flex gap-2">
            <Input
              id="project-name"
              name="project-name"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Project name"
              required
            />
            <Button variant="default" type="submit" disabled={creating || !userId}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </form>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {actionMessage ? <p className="text-sm text-green-600">{actionMessage}</p> : null}
          {loading ? <p className="text-sm text-muted-foreground">Loading projects...</p> : null}

          {!loading && projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet</p>
          ) : null}

          {!loading && projects.length > 0 ? (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 p-2"
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 rounded-md px-2 py-1 text-sm hover:bg-accent"
                  >
                    {project.name}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" aria-label="Project actions">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShareProject(project.id)}>
                        <Share2Icon className="h-4 w-4" />
                        Share link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                        Delete project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
