import { DEFAULT_MODEL_ID, isModelId } from "./catalog";

const STORAGE_KEY = "chaenix.ai.settings";
const STORAGE_VERSION = 1;

type StoredSettings = {
  version: number;
  defaultModelId: string;
};

const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function loadDefaultModelId(): string {
  if (typeof window === "undefined") {
    return DEFAULT_MODEL_ID;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_MODEL_ID;
    }

    const parsed = JSON.parse(raw) as Partial<StoredSettings>;

    if (
      parsed &&
      typeof parsed.defaultModelId === "string" &&
      isModelId(parsed.defaultModelId)
    ) {
      return parsed.defaultModelId;
    }
  } catch (error) {
    console.error("[AiSettings] Failed to read settings:", error);
  }

  return DEFAULT_MODEL_ID;
}

export function saveDefaultModelId(modelId: string): void {
  if (typeof window === "undefined" || !isModelId(modelId)) {
    return;
  }

  try {
    const settings: StoredSettings = {
      version: STORAGE_VERSION,
      defaultModelId: modelId,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    emitChange();
  } catch (error) {
    console.error("[AiSettings] Failed to save settings:", error);
  }
}

export function subscribeDefaultModelId(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

export function getDefaultModelIdSnapshot(): string {
  return loadDefaultModelId();
}

export function getDefaultModelIdServerSnapshot(): string {
  return DEFAULT_MODEL_ID;
}
