"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

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

  return (
    <main>
      <h1>{project ? project.name : "Project"}</h1>

      <form onSubmit={handleCreateFlow}>
        <label htmlFor="flow-name">New flow</label>
        <input
          id="flow-name"
          name="flow-name"
          value={newFlowName}
          onChange={(event) => setNewFlowName(event.target.value)}
          placeholder="Flow name"
          required
        />
        <button type="submit" disabled={creating || !project || !userId}>
          {creating ? "Creating..." : "New flow"}
        </button>
      </form>

      {error ? <p>{error}</p> : null}
      {loading ? <p>Loading project...</p> : null}

      {!loading && !project ? <p>Project not found</p> : null}

      {!loading && project && flows.length === 0 ? <p>No flows yet</p> : null}

      {!loading && project && flows.length > 0 ? (
        <ul>
          {flows.map((flow) => (
            <li key={flow.id}>
              <Link href={`/flows/${flow.id}`}>{flow.name}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
