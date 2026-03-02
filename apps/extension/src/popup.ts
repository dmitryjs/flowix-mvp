import "./styles.css";

const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const captureBtn = document.getElementById("captureBtn");

function setStatus(recording: boolean) {
  if (!statusEl) return;
  statusEl.textContent = `Recording: ${recording ? "ON" : "OFF"}`;
}

async function refreshStatus() {
  const result = await chrome.storage.local.get(["recording"]);
  setStatus(Boolean(result.recording));
}

startBtn?.addEventListener("click", async () => {
  await chrome.storage.local.set({ recording: true });
  setStatus(true);
});

stopBtn?.addEventListener("click", async () => {
  await chrome.storage.local.set({ recording: false });
  setStatus(false);
});

captureBtn?.addEventListener("click", async () => {
  console.log("capture");
  await chrome.storage.local.set({ lastCaptureAt: Date.now() });
});

void refreshStatus();
