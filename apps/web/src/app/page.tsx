"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
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

  return (
    <main>
      <h1>Projects</h1>

      <form onSubmit={handleCreateProject}>
        <label htmlFor="project-name">New project</label>
        <input
          id="project-name"
          name="project-name"
          value={newProjectName}
          onChange={(event) => setNewProjectName(event.target.value)}
          placeholder="Project name"
          required
        />
        <button type="submit" disabled={creating || !userId}>
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {error ? <p>{error}</p> : null}
      {loading ? <p>Loading projects...</p> : null}

      {!loading && projects.length === 0 ? <p>No projects yet</p> : null}

      {!loading && projects.length > 0 ? (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/projects/${project.id}`}>{project.name}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
