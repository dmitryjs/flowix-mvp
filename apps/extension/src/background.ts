chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(["recording"]);
  if (typeof existing.recording !== "boolean") {
    await chrome.storage.local.set({ recording: false });
  }
});
