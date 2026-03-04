const WEB_APP_URL = "http://localhost:3000";

type CaptureResult = { ok: true } | { ok: false; error: string };
type ElementRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
type AutoCapturePayload = {
  clickX?: number;
  clickY?: number;
  url?: string;
  selector?: string;
  elementRect?: ElementRect;
};
const AUTO_CAPTURE_THROTTLE_MS = 600;
let lastAutoCaptureAt = 0;

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
  if (message?.type === "captureStep") {
    void captureStep()
      .then((result) => sendResponse(result))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Capture failed"
        } satisfies CaptureResult)
      );
    return true;
  }

  if (message?.type === "startAutoCapture") {
    void ensureTrackerOnActiveTab()
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Failed to start auto capture"
        })
      );
    return true;
  }

  if (message?.type === "stopAutoCapture") {
    void removeTrackerFromActiveTab()
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Failed to stop auto capture"
        })
      );
    return true;
  }

  if (message?.type === "autoCaptureClick") {
    void handleAutoCaptureClick(message.payload as AutoCapturePayload);
    return;
  }
});

async function handleAutoCaptureClick(payload: AutoCapturePayload) {
  const state = await chrome.storage.local.get(["recording"]);
  if (state.recording !== true) {
    return;
  }
  const now = Date.now();
  if (now - lastAutoCaptureAt < AUTO_CAPTURE_THROTTLE_MS) {
    return;
  }
  lastAutoCaptureAt = now;
  await captureStep(payload);
}

chrome.tabs.onActivated.addListener(async () => {
  const state = await chrome.storage.local.get(["recording"]);
  if (state.recording === true) {
    await ensureTrackerOnActiveTab();
  }
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;
  const state = await chrome.storage.local.get(["recording"]);
  if (state.recording === true) {
    await ensureTrackerOnActiveTab();
  }
});

async function captureStep(payload?: AutoCapturePayload): Promise<CaptureResult> {
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
      return { ok: false, error: "Select project first" };
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
      throw new Error("Sync session first");
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
    formData.append("url", payload?.url ?? tab.url ?? "");
    formData.append("stepIndex", String(stepIndex));
    if (typeof payload?.clickX === "number") {
      formData.append("clickX", String(payload.clickX));
    }
    if (typeof payload?.clickY === "number") {
      formData.append("clickY", String(payload.clickY));
    }
    if (typeof payload?.selector === "string" && payload.selector) {
      formData.append("selector", payload.selector);
    }
    if (payload?.elementRect) {
      formData.append("elementRect", JSON.stringify(payload.elementRect));
    }
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

async function ensureTrackerOnActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("http")) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const windowWithTracker = window as Window & {
        __flowixTrackerInstalled?: boolean;
        __flowixClickHandler?: (event: PointerEvent) => void;
      };
      if (windowWithTracker.__flowixTrackerInstalled) return;

      const getSelector = (element: Element | null): string => {
        if (!element) return "";
        if (element.id) return `#${element.id}`;
        const path: string[] = [];
        let current: Element | null = element;
        while (current && path.length < 4) {
          const tagName = current.tagName.toLowerCase();
          const className = current.className
            .toString()
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .join(".");
          const selector = className ? `${tagName}.${className}` : tagName;
          path.unshift(selector);
          current = current.parentElement;
        }
        return path.join(" > ");
      };

      const handler = (event: PointerEvent) => {
        if (event.button !== 0) return;
        const target = event.target instanceof Element ? event.target : null;
        const rect = target?.getBoundingClientRect();
        let overlay: HTMLDivElement | null = null;
        if (rect && rect.width > 0 && rect.height > 0) {
          overlay = document.createElement("div");
          overlay.style.position = "fixed";
          overlay.style.left = `${rect.left}px`;
          overlay.style.top = `${rect.top}px`;
          overlay.style.width = `${rect.width}px`;
          overlay.style.height = `${rect.height}px`;
          overlay.style.border = "2px solid #ef4444";
          overlay.style.borderRadius = "4px";
          overlay.style.pointerEvents = "none";
          overlay.style.zIndex = "2147483647";
          document.documentElement.appendChild(overlay);
          setTimeout(() => overlay?.remove(), 180);
        }

        chrome.runtime.sendMessage({
          type: "autoCaptureClick",
          payload: {
            clickX: Math.round(event.clientX),
            clickY: Math.round(event.clientY),
            url: window.location.href,
            selector: getSelector(target),
            elementRect: rect
              ? {
                  x: Math.round(rect.left),
                  y: Math.round(rect.top),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height)
                }
              : undefined
          }
        });
      };

      window.addEventListener("pointerdown", handler, true);
      windowWithTracker.__flowixClickHandler = handler;
      windowWithTracker.__flowixTrackerInstalled = true;
    }
  });
}

async function removeTrackerFromActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const windowWithTracker = window as Window & {
        __flowixTrackerInstalled?: boolean;
        __flowixClickHandler?: (event: PointerEvent) => void;
      };
      if (!windowWithTracker.__flowixTrackerInstalled) return;
      const handler = windowWithTracker.__flowixClickHandler;
      if (handler) {
        window.removeEventListener("pointerdown", handler, true);
      }
      windowWithTracker.__flowixClickHandler = undefined;
      windowWithTracker.__flowixTrackerInstalled = false;
    }
  });
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
