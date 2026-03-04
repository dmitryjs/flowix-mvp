"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon, Share2Icon, Trash2Icon } from "lucide-react";

type Flow = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [newFlowName, setNewFlowName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
        .select("id, name")
        .eq("project_id", projectId)
        .eq("owner_id", user.id)
        .order("name", { ascending: true });

      if (flowsError) {
        setError(flowsError.message);
        setLoading(false);
        return;
      }

      setFlows((flowsData ?? []) as Flow[]);
      setLoading(false);
    };

    void loadProjectData();
  }, [projectId]);

  const handleCreateFlow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      .select("id, name")
      .single();

    if (insertError) {
      setError(insertError.message);
      setCreating(false);
      return;
    }

    if (data) {
      setFlows((prev) => [...prev, data as Flow]);
      setNewFlowName("");
    }

    setCreating(false);
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
    setActionMessage("Flow deleted");
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle>{project ? project.name : "Project"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateFlow} className="flex gap-2">
            <Input
              id="flow-name"
              name="flow-name"
              value={newFlowName}
              onChange={(event) => setNewFlowName(event.target.value)}
              placeholder="Flow name"
              required
            />
            <Button variant="default" type="submit" disabled={creating || !project || !userId}>
              {creating ? "Creating..." : "New flow"}
            </Button>
          </form>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {actionMessage ? <p className="text-sm text-green-600">{actionMessage}</p> : null}
          {loading ? <p className="text-sm text-muted-foreground">Loading project...</p> : null}

          {!loading && !project ? <p className="text-sm">Project not found</p> : null}

          {!loading && project && flows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No flows yet</p>
          ) : null}

          {!loading && project && flows.length > 0 ? (
            <div className="space-y-2">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 p-2"
                >
                  <Link
                    href={`/flows/${flow.id}`}
                    className="flex-1 rounded-md px-2 py-1 text-sm hover:bg-accent"
                  >
                    {flow.name}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" aria-label="Flow actions">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShareFlow(flow.id)}>
                        <Share2Icon className="h-4 w-4" />
                        Share link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteFlow(flow.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                        Delete flow
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
