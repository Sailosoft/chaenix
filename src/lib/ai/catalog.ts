export type CostTier = "low" | "mid" | "high";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  cost: CostTier;
  imageSupport: boolean;
  providerModel: string;
  isNative?: boolean;
};

export const DEEPINFRA_PROVIDER_NAME = "DeepInfra";

export const DEEPINFRA_BASE_URL = "https://api.deepinfra.com/v1/openai";

export const NATIVE_MODEL_ID = "native";

export const DEFAULT_MODEL_ID = "flash-multi";

export const DEEPINFRA_MODELS: ChatModel[] = [
  {
    id: "flash",
    name: "Flash",
    provider: DEEPINFRA_PROVIDER_NAME,
    cost: "low",
    imageSupport: false,
    providerModel: "deepseek-ai/DeepSeek-V4-Flash-0731",
  },
  {
    id: "flash-multi",
    name: "Flash Multi",
    provider: DEEPINFRA_PROVIDER_NAME,
    cost: "low",
    imageSupport: true,
    providerModel: "XiaomiMiMo/MiMo-V2.6-Flash",
  },
  {
    id: "flash-pro",
    name: "Flash Pro",
    provider: DEEPINFRA_PROVIDER_NAME,
    cost: "mid",
    imageSupport: true,
    providerModel: "deepseek-ai/DeepSeek-V4.1-Flash",
  },
  {
    id: "pro",
    name: "Pro",
    provider: DEEPINFRA_PROVIDER_NAME,
    cost: "mid",
    imageSupport: true,
    providerModel: "zai-org/GLM-5.3",
  },
  {
    id: "max",
    name: "Max",
    provider: DEEPINFRA_PROVIDER_NAME,
    cost: "high",
    imageSupport: true,
    providerModel: "moonshotai/Kimi-K3",
  },
  {
    id: "ultra",
    name: "Ultra",
    provider: DEEPINFRA_PROVIDER_NAME,
    cost: "high",
    imageSupport: true,
    providerModel: "Qwen/Qwen3.8-2.4T-A95B",
  },
];

export function getDeepInfraModelById(id: string): ChatModel | undefined {
  return DEEPINFRA_MODELS.find((model) => model.id === id);
}

export function isModelId(id: string): boolean {
  return id === NATIVE_MODEL_ID || getDeepInfraModelById(id) !== undefined;
}
