import "./styles.css";
import flowixLogo from "../../web/src/ui-kit/logo.png";

const WEB_APP_URL = "http://localhost:3000";
const DEFAULT_CAPTURE_SHORTCUT = "Alt+Shift+C";

type Project = {
  id: string;
  name: string;
};

const statusRecordingEl = document.getElementById("statusRecording");
const statusTokenEl = document.getElementById("statusToken");
const statusFlowEl = document.getElementById("statusFlow");
const messageEl = document.getElementById("message");
const projectSelectEl = document.getElementById("projectSelect") as HTMLSelectElement | null;
const syncBtn = document.getElementById("syncBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const captureShortcutBtn = document.getElementById("captureShortcutBtn");
const flowActionsEl = document.getElementById("flowActions");
const openFlowBtn = document.getElementById("openFlowBtn");
const copyFlowBtn = document.getElementById("copyFlowBtn");
const logoImgEl = document.getElementById("logoImg") as HTMLImageElement | null;
let waitingForShortcut = false;

function setRecordingStatus(recording: boolean) {
  if (!statusRecordingEl) return;
  statusRecordingEl.textContent = `Recording: ${recording ? "ON" : "OFF"}`;
}

function setTokenStatus(accessToken: string) {
  if (!statusTokenEl) return;
  statusTokenEl.textContent = `Session: ${accessToken ? "connected" : "missing"}`;
}

function setFlowStatus(flowId: string | null) {
  if (!statusFlowEl) return;
  statusFlowEl.textContent = `Current flow: ${flowId ?? "none"}`;
  if (openFlowBtn instanceof HTMLButtonElement) {
    openFlowBtn.disabled = !flowId;
  }
  if (copyFlowBtn instanceof HTMLButtonElement) {
    copyFlowBtn.disabled = !flowId;
  }
}

function setFlowActionsVisibility(recording: boolean, flowId: string | null) {
  if (!flowActionsEl) return;
  const shouldShow = !recording && Boolean(flowId);
  flowActionsEl.hidden = !shouldShow;
}

function setMessage(message: string) {
  if (!messageEl) return;
  messageEl.textContent = message;
}

function normalizeShortcutKey(key: string): string {
  const value = key.trim();
  if (!value) return "";
  if (value === " ") return "Space";
  if (value.length === 1) return value.toUpperCase();
  const map: Record<string, string> = {
    Escape: "Esc",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
  };
  return map[value] ?? value;
}

function shortcutFromKeyboardEvent(event: KeyboardEvent): string | null {
  const key = normalizeShortcutKey(event.key);
  if (!key || ["Control", "Alt", "Shift", "Meta"].includes(key)) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");
  parts.push(key);
  return parts.join("+");
}

async function getCaptureShortcut(): Promise<string> {
  const state = await chrome.storage.local.get(["captureShortcut"]);
  if (typeof state.captureShortcut === "string" && state.captureShortcut.trim()) {
    return state.captureShortcut.trim();
  }
  await chrome.storage.local.set({ captureShortcut: DEFAULT_CAPTURE_SHORTCUT });
  return DEFAULT_CAPTURE_SHORTCUT;
}

function setCaptureShortcutLabel(shortcut: string) {
  if (!(captureShortcutBtn instanceof HTMLButtonElement)) return;
  captureShortcutBtn.textContent = shortcut;
}

function parseAccessTokenFromStorage(): string | null {
  const key = Object.keys(localStorage).find((item) =>
    item.includes("auth-token")
  );
  if (!key) return null;

  const rawValue = localStorage.getItem(key);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as
      | { access_token?: string; currentSession?: { access_token?: string } }
      | Array<{ access_token?: string }>;
    if (Array.isArray(parsed)) {
      const token = parsed[0]?.access_token;
      return typeof token === "string" ? token : null;
    }
    if (typeof parsed.access_token === "string") {
      return parsed.access_token;
    }
    const nestedToken = parsed.currentSession?.access_token;
    return typeof nestedToken === "string" ? nestedToken : null;
  } catch {
    return null;
  }
}

async function getAccessTokenFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith(WEB_APP_URL)) {
    return null;
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: parseAccessTokenFromStorage
  });

  return typeof result === "string" && result.trim() ? result.trim() : null;
}

async function fetchProjects(accessToken: string): Promise<Project[]> {
  const response = await fetch(`${WEB_APP_URL}/api/projects`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Load projects failed: ${text}`);
  }

  const data = (await response.json()) as Array<{ id: string; name: string }>;
  return data;
}

async function fetchTokenFromApi() {
  const response = await fetch(`${WEB_APP_URL}/api/auth/token`, {
    method: "GET",
    credentials: "include"
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { accessToken?: string };
  return typeof data.accessToken === "string" ? data.accessToken : null;
}

async function renderProjects(projects: Project[]) {
  if (!projectSelectEl) return;

  const current = await chrome.storage.local.get(["projectId"]);
  const currentProjectId =
    typeof current.projectId === "string" ? current.projectId : "";

  projectSelectEl.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent =
    projects.length > 0 ? "Select project" : "No projects found";
  projectSelectEl.appendChild(placeholder);

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    projectSelectEl.appendChild(option);
  });

  if (currentProjectId && projects.some((project) => project.id === currentProjectId)) {
    projectSelectEl.value = currentProjectId;
  } else {
    projectSelectEl.value = "";
    await chrome.storage.local.set({ projectId: "" });
  }
}

async function syncSessionAndProjects() {
  const state = await chrome.storage.local.get(["accessToken"]);
  let accessToken =
    typeof state.accessToken === "string" ? state.accessToken.trim() : "";

  const tokenFromActiveTab = await getAccessTokenFromActiveTab();
  if (tokenFromActiveTab) {
    accessToken = tokenFromActiveTab;
    await chrome.storage.local.set({ accessToken });
  } else if (!accessToken) {
    const tokenFromApi = await fetchTokenFromApi();
    if (tokenFromApi) {
      accessToken = tokenFromApi;
      await chrome.storage.local.set({ accessToken });
    }
  }

  setTokenStatus(accessToken);

  if (!accessToken) {
    await renderProjects([]);
    setMessage("Open web app tab and login first");
    return;
  }

  try {
    const projects = await fetchProjects(accessToken);
    await renderProjects(projects);
    setMessage(projects.length > 0 ? "Session synced" : "No projects yet");
  } catch (error) {
    await renderProjects([]);
    await chrome.storage.local.set({ accessToken: "", projectId: "" });
    setTokenStatus("");
    setMessage(
      error instanceof Error ? error.message : "Failed to sync session"
    );
  }
}

async function refreshStatus() {
  const result = await chrome.storage.local.get([
    "recording",
    "projectId",
    "accessToken",
    "currentFlowId",
    "showFlowActions"
  ]);
  const recording = Boolean(result.recording);
  const accessToken = typeof result.accessToken === "string" ? result.accessToken : "";
  const currentFlowId = typeof result.currentFlowId === "string" ? result.currentFlowId : null;
  const showFlowActions = result.showFlowActions === true;

  setRecordingStatus(recording);
  setTokenStatus(accessToken.trim());
  setFlowStatus(currentFlowId);
  setFlowActionsVisibility(recording || !showFlowActions, currentFlowId);
  if (projectSelectEl && typeof result.projectId === "string") {
    projectSelectEl.value = result.projectId;
  }
}

syncBtn?.addEventListener("click", async () => {
  await syncSessionAndProjects();
  await refreshStatus();
});

startBtn?.addEventListener("click", async () => {
  await syncSessionAndProjects();
  const stateWithSession = await chrome.storage.local.get([
    "projectId",
    "accessToken",
    "stepIndex"
  ]);
  const projectId =
    typeof stateWithSession.projectId === "string"
      ? stateWithSession.projectId.trim()
      : "";
  const accessToken =
    typeof stateWithSession.accessToken === "string"
      ? stateWithSession.accessToken.trim()
      : "";

  if (!accessToken) {
    setMessage("Login in web app and click Sync");
    return;
  }
  if (!projectId) {
    setMessage("Select project first");
    return;
  }

  const nextStepIndex = 0;
  await chrome.storage.local.set({
    projectId,
    accessToken,
    recording: true,
    currentFlowId: null,
    stepIndex: nextStepIndex,
    showFlowActions: false
  });
  await chrome.runtime.sendMessage({ type: "startAutoCapture" });
  setRecordingStatus(true);
  setTokenStatus(accessToken);
  setFlowStatus(null);
  setFlowActionsVisibility(true, null);
  setMessage("");
});

stopBtn?.addEventListener("click", async () => {
  const state = await chrome.storage.local.get(["currentFlowId"]);
  const hasFlow = typeof state.currentFlowId === "string" && state.currentFlowId.trim().length > 0;
  await chrome.storage.local.set({ recording: false, showFlowActions: hasFlow });
  await chrome.runtime.sendMessage({ type: "stopAutoCapture" });
  setRecordingStatus(false);
  setMessage("");
  await refreshStatus();
});

projectSelectEl?.addEventListener("change", async () => {
  const value = projectSelectEl.value.trim();
  await chrome.storage.local.set({ projectId: value });
});

openFlowBtn?.addEventListener("click", async () => {
  const state = await chrome.storage.local.get(["currentFlowId"]);
  const flowId =
    typeof state.currentFlowId === "string" ? state.currentFlowId : "";
  if (!flowId) {
    setMessage("No recorded flow yet");
    return;
  }
  await chrome.tabs.create({ url: `${WEB_APP_URL}/flows/${flowId}` });
});

copyFlowBtn?.addEventListener("click", async () => {
  const state = await chrome.storage.local.get(["currentFlowId"]);
  const flowId =
    typeof state.currentFlowId === "string" ? state.currentFlowId : "";
  if (!flowId) {
    setMessage("No recorded flow yet");
    return;
  }
  await navigator.clipboard.writeText(`${WEB_APP_URL}/flows/${flowId}`);
  setMessage("Flow link copied");
});

captureShortcutBtn?.addEventListener("click", () => {
  waitingForShortcut = true;
  setCaptureShortcutLabel("Press keys...");
  setMessage("Press desired key combination");
});

document.addEventListener("keydown", async (event) => {
  if (!waitingForShortcut) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    waitingForShortcut = false;
    setCaptureShortcutLabel(await getCaptureShortcut());
    setMessage("Shortcut setup cancelled");
    return;
  }

  const shortcut = shortcutFromKeyboardEvent(event);
  if (!shortcut) {
    setMessage("Use at least one non-modifier key");
    return;
  }

  waitingForShortcut = false;
  await chrome.storage.local.set({ captureShortcut: shortcut });
  setCaptureShortcutLabel(shortcut);
  setMessage("Shortcut updated");
});

void (async () => {
  if (logoImgEl) {
    logoImgEl.src = flowixLogo;
  }
  const settings = await chrome.storage.local.get(["showFlowActions"]);
  if (typeof settings.showFlowActions !== "boolean") {
    await chrome.storage.local.set({ showFlowActions: false });
  }
  const shortcut = await getCaptureShortcut();
  setCaptureShortcutLabel(shortcut);
  await syncSessionAndProjects();
  await refreshStatus();
})();
