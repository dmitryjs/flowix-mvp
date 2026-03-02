import "./styles.css";

const statusRecordingEl = document.getElementById("statusRecording");
const statusProjectEl = document.getElementById("statusProject");
const statusTokenEl = document.getElementById("statusToken");
const statusFlowEl = document.getElementById("statusFlow");
const statusStepEl = document.getElementById("statusStep");
const messageEl = document.getElementById("message");
const projectIdInput = document.getElementById("projectIdInput") as HTMLInputElement | null;
const accessTokenInput = document.getElementById("accessTokenInput") as HTMLTextAreaElement | null;
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const captureBtn = document.getElementById("captureBtn");

function setRecordingStatus(recording: boolean) {
  if (!statusRecordingEl) return;
  statusRecordingEl.textContent = `Recording: ${recording ? "ON" : "OFF"}`;
}

function setProjectStatus(projectId: string) {
  if (!statusProjectEl) return;
  statusProjectEl.textContent = `Project ID: ${projectId ? "set" : "missing"}`;
}

function setTokenStatus(accessToken: string) {
  if (!statusTokenEl) return;
  statusTokenEl.textContent = `Token: ${accessToken ? "set" : "missing"}`;
}

function setFlowStatus(flowId: string | null) {
  if (!statusFlowEl) return;
  statusFlowEl.textContent = `Current flow: ${flowId ?? "none"}`;
}

function setStepStatus(stepIndex: number) {
  if (!statusStepEl) return;
  statusStepEl.textContent = `Next step index: ${stepIndex}`;
}

function setMessage(message: string) {
  if (!messageEl) return;
  messageEl.textContent = message;
}

async function refreshStatus() {
  const result = await chrome.storage.local.get([
    "recording",
    "projectId",
    "accessToken",
    "currentFlowId",
    "stepIndex"
  ]);
  const recording = Boolean(result.recording);
  const projectId = typeof result.projectId === "string" ? result.projectId : "";
  const accessToken = typeof result.accessToken === "string" ? result.accessToken : "";
  const currentFlowId = typeof result.currentFlowId === "string" ? result.currentFlowId : null;
  const stepIndex = typeof result.stepIndex === "number" ? result.stepIndex : 0;

  setRecordingStatus(recording);
  setProjectStatus(projectId.trim());
  setTokenStatus(accessToken.trim());
  setFlowStatus(currentFlowId);
  setStepStatus(stepIndex);

  if (projectIdInput && typeof result.projectId === "string") {
    projectIdInput.value = result.projectId;
  }
  if (accessTokenInput && typeof result.accessToken === "string") {
    accessTokenInput.value = result.accessToken;
  }
}

startBtn?.addEventListener("click", async () => {
  const projectId = projectIdInput?.value.trim() ?? "";
  const accessToken = accessTokenInput?.value.trim() ?? "";
  const state = await chrome.storage.local.get(["stepIndex"]);
  const nextStepIndex = typeof state.stepIndex === "number" ? state.stepIndex : 0;
  await chrome.storage.local.set({ projectId, accessToken, recording: true, stepIndex: nextStepIndex });
  setRecordingStatus(true);
  setProjectStatus(projectId);
  setTokenStatus(accessToken);
  setStepStatus(nextStepIndex);
  setMessage("");
});

stopBtn?.addEventListener("click", async () => {
  await chrome.storage.local.set({ recording: false, currentFlowId: null, stepIndex: 0 });
  setRecordingStatus(false);
  setFlowStatus(null);
  setStepStatus(0);
  setMessage("");
});

captureBtn?.addEventListener("click", async () => {
  const state = await chrome.storage.local.get(["recording", "accessToken"]);
  if (state.recording !== true) {
    setMessage("Start recording first");
    return;
  }
  if (typeof state.accessToken !== "string" || !state.accessToken.trim()) {
    setMessage("Paste access token first");
    return;
  }

  const projectId = projectIdInput?.value.trim() ?? "";
  const accessToken = accessTokenInput?.value.trim() ?? "";
  await chrome.storage.local.set({ projectId, accessToken });

  const response = (await chrome.runtime.sendMessage({
    type: "captureStep"
  })) as { ok: boolean; error?: string } | undefined;

  if (!response) {
    setMessage("Capture failed");
    return;
  }

  if (!response.ok) {
    setMessage(response.error ?? "Capture failed");
    return;
  }

  setMessage("Captured");
  await refreshStatus();
});

projectIdInput?.addEventListener("input", async () => {
  const value = projectIdInput.value.trim();
  await chrome.storage.local.set({ projectId: value });
  setProjectStatus(value);
});

accessTokenInput?.addEventListener("input", async () => {
  const value = accessTokenInput.value.trim();
  await chrome.storage.local.set({ accessToken: value });
  setTokenStatus(value);
});

void refreshStatus();
