import "./styles.css";

const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");
const projectIdInput = document.getElementById("projectIdInput") as HTMLInputElement | null;
const accessTokenInput = document.getElementById("accessTokenInput") as HTMLTextAreaElement | null;
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const captureBtn = document.getElementById("captureBtn");

function setStatus(recording: boolean) {
  if (!statusEl) return;
  statusEl.textContent = `Recording: ${recording ? "ON" : "OFF"}`;
}

function setMessage(message: string) {
  if (!messageEl) return;
  messageEl.textContent = message;
}

async function refreshStatus() {
  const result = await chrome.storage.local.get(["recording", "projectId", "accessToken"]);
  setStatus(Boolean(result.recording));
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
  await chrome.storage.local.set({ projectId, accessToken });
  await chrome.storage.local.set({ recording: true });
  setStatus(true);
  setMessage("");
});

stopBtn?.addEventListener("click", async () => {
  await chrome.storage.local.set({ recording: false });
  setStatus(false);
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
});

projectIdInput?.addEventListener("input", async () => {
  await chrome.storage.local.set({ projectId: projectIdInput.value.trim() });
});

accessTokenInput?.addEventListener("input", async () => {
  await chrome.storage.local.set({ accessToken: accessTokenInput.value.trim() });
});

void refreshStatus();
