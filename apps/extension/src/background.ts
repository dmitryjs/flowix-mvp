const WEB_APP_URL = "http://localhost:3000";

type CaptureResult = { ok: true } | { ok: false; error: string };

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get([
    "recording",
    "currentFlowId",
    "stepIndex",
    "projectId"
  ]);

  const defaults: Record<string, unknown> = {};
  if (typeof existing.recording !== "boolean") defaults.recording = false;
  if (typeof existing.currentFlowId !== "string") defaults.currentFlowId = null;
  if (typeof existing.stepIndex !== "number") defaults.stepIndex = 0;
  if (typeof existing.projectId !== "string") defaults.projectId = "";

  if (Object.keys(defaults).length > 0) {
    await chrome.storage.local.set(defaults);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "captureStep") {
    return;
  }

  void captureStep()
    .then((result) => sendResponse(result))
    .catch((error: unknown) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Capture failed"
      } satisfies CaptureResult)
    );

  return true;
});

async function captureStep(): Promise<CaptureResult> {
  try {
    const state = await chrome.storage.local.get([
      "recording",
      "currentFlowId",
      "stepIndex",
      "projectId",
      "accessToken"
    ]);

    if (state.recording !== true) {
      return { ok: false, error: "Start recording first" };
    }

    const projectId = typeof state.projectId === "string" ? state.projectId.trim() : "";
    if (!projectId) {
      return { ok: false, error: "Set Project ID first" };
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      return { ok: false, error: "Active tab not found" };
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: "png" });
    const file = dataUrlToFile(dataUrl, `step-${Date.now()}.png`);

    const accessToken =
      typeof state.accessToken === "string" ? state.accessToken.trim() : "";
    if (!accessToken) {
      throw new Error("Paste access token first");
    }
    let flowId = typeof state.currentFlowId === "string" ? state.currentFlowId : null;

    if (!flowId) {
      const createFlowResponse = await fetch(`${WEB_APP_URL}/api/flows`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId,
          name: "Recorded Flow"
        })
      });

      if (!createFlowResponse.ok) {
        const text = await createFlowResponse.text();
        return { ok: false, error: `Create flow failed: ${text}` };
      }

      const flowData = (await createFlowResponse.json()) as { id?: string };
      if (!flowData.id) {
        return { ok: false, error: "Create flow response missing id" };
      }

      flowId = flowData.id;
      await chrome.storage.local.set({ currentFlowId: flowId });
    }

    const stepIndex = typeof state.stepIndex === "number" ? state.stepIndex : 0;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("url", tab.url ?? "");
    formData.append("stepIndex", String(stepIndex));
    if (typeof tab.width === "number") formData.append("viewportW", String(tab.width));
    if (typeof tab.height === "number") formData.append("viewportH", String(tab.height));

    const stepResponse = await fetch(`${WEB_APP_URL}/api/flows/${flowId}/steps`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!stepResponse.ok) {
      const text = await stepResponse.text();
      return { ok: false, error: `Upload step failed: ${text}` };
    }

    await chrome.storage.local.set({
      stepIndex: stepIndex + 1,
      lastCaptureAt: Date.now()
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Capture failed"
    };
  }
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, base64] = dataUrl.split(",");
  if (!meta || !base64) {
    throw new Error("Invalid screenshot data");
  }

  const mimeMatch = meta.match(/data:(.*);base64/);
  const mimeType = mimeMatch?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mimeType });
}
