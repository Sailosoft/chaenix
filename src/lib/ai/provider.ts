import "server-only";

import {
  DEEPINFRA_BASE_URL,
  DEEPINFRA_MODELS,
  DEEPINFRA_PROVIDER_NAME,
  NATIVE_MODEL_ID,
  type ChatModel,
} from "./catalog";

export type ResolvedModel = {
  baseURL: string;
  apiKey: string;
  providerModel: string;
  provider: string;
  imageSupport: boolean;
};

export type NativeSettings = {
  baseUrl: string;
  model: string;
  imageSupport: boolean;
};

function resolveNativeBaseUrl(): string {
  return (
    process.env.AI_BASE_URL ??
    process.env.OLLAMA_BASE_URL ??
    "http://127.0.0.1:11434/v1"
  );
}

function resolveNativeApiKey(): string {
  const configured = process.env.AI_API_KEY?.trim();

  if (configured) {
    return configured;
  }

  return process.env.OLLAMA_API_KEY ?? "ollama";
}

function resolveNativeModel(): string {
  return (
    process.env.AI_MODEL ?? process.env.OLLAMA_MODEL ?? "gemma4:31b-cloud"
  );
}

function resolveNativeImageSupport(): boolean {
  const value = process.env.AI_MODEL_IMAGE_SUPPORT?.trim().toLowerCase();

  if (value === undefined || value === "") {
    return true;
  }

  return value !== "false" && value !== "0" && value !== "no";
}

function resolveDeepInfraApiKey(): string {
  const key = process.env.DEEPINFRA_API_KEY?.trim();

  if (key) {
    return key;
  }

  return process.env.AI_API_KEY?.trim() ?? "";
}

function toHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || "Native";
  }
}

function toProviderLabel(url: string): string {
  const host = toHost(url);
  return host || "Native";
}

export function buildNativeModel(): ChatModel {
  const baseUrl = resolveNativeBaseUrl();

  return {
    id: NATIVE_MODEL_ID,
    name: "Native",
    provider: toProviderLabel(baseUrl),
    cost: "mid",
    imageSupport: resolveNativeImageSupport(),
    providerModel: resolveNativeModel(),
    isNative: true,
  };
}

export function buildClientModelList(): ChatModel[] {
  return [buildNativeModel(), ...DEEPINFRA_MODELS];
}

export function resolveModelSelection(
  modelId: string,
): ResolvedModel | undefined {
  if (modelId === NATIVE_MODEL_ID) {
    const baseURL = resolveNativeBaseUrl();

    return {
      baseURL,
      apiKey: resolveNativeApiKey(),
      providerModel: resolveNativeModel(),
      provider: toProviderLabel(baseURL),
      imageSupport: resolveNativeImageSupport(),
    };
  }

  const model = DEEPINFRA_MODELS.find((entry) => entry.id === modelId);

  if (!model) {
    return undefined;
  }

  return {
    baseURL: DEEPINFRA_BASE_URL,
    apiKey: resolveDeepInfraApiKey(),
    providerModel: model.providerModel,
    provider: DEEPINFRA_PROVIDER_NAME,
    imageSupport: model.imageSupport,
  };
}

export function getNativeSettings(): NativeSettings {
  return {
    baseUrl: resolveNativeBaseUrl(),
    model: resolveNativeModel(),
    imageSupport: resolveNativeImageSupport(),
  };
}
