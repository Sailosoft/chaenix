"use client";

import { useSyncExternalStore, useState } from "react";

import { DEFAULT_MODEL_ID, type ChatModel } from "@/lib/ai/catalog";
import {
  getDefaultModelIdServerSnapshot,
  getDefaultModelIdSnapshot,
  saveDefaultModelId,
  subscribeDefaultModelId,
} from "@/lib/ai/settings";

type NativeSettings = {
  baseUrl: string;
  model: string;
  imageSupport: boolean;
};

type SettingsUiProps = {
  models: ChatModel[];
  native: NativeSettings;
};

const costTierLabels: Record<ChatModel["cost"], string> = {
  low: "Low",
  mid: "Mid",
  high: "High",
};

const costTierStyles: Record<ChatModel["cost"], string> = {
  low: "bg-emerald-50 text-emerald-600 ring-emerald-200/60",
  mid: "bg-amber-50 text-amber-600 ring-amber-200/60",
  high: "bg-rose-50 text-rose-600 ring-rose-200/60",
};

function NativeInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="min-w-0 truncate font-mono text-xs text-[var(--text-secondary)]">
        {value}
      </dd>
    </div>
  );
}

export function SettingsUi({ models, native }: SettingsUiProps) {
  const defaultModelId = useSyncExternalStore(
    subscribeDefaultModelId,
    getDefaultModelIdSnapshot,
    getDefaultModelIdServerSnapshot,
  );
  const [isSaved, setIsSaved] = useState(false);

  function handleChange(nextModelId: string): void {
    saveDefaultModelId(nextModelId);
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 1800);
  }

  return (
    <main className="mx-auto w-full max-w-4xl">
      <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-[0_4px_24px_-4px_rgba(100,130,180,0.18),0_0_0_1px_rgba(200,215,240,0.25)] backdrop-blur-sm">
        <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--brand-soft)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-[var(--brand)]"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
                AI Settings
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Choose the default model and review provider configuration.
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-opacity duration-200 ${
              isSaved
                ? "bg-emerald-50 text-emerald-600 opacity-100"
                : "opacity-0"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved
          </span>
        </header>

        <div className="space-y-6 px-6 py-5">
          <div>
            <label
              htmlFor="default-model"
              className="text-sm font-semibold text-[var(--text-primary)]"
            >
              Default model
            </label>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Applied to new conversations. Existing chats keep their own model.
            </p>

            <select
              id="default-model"
              value={defaultModelId}
              onChange={(event) => handleChange(event.currentTarget.value)}
              className="mt-3 w-full rounded-xl border border-[var(--border)]/60 bg-white px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--brand)]/50 focus:ring-1 focus:ring-[var(--brand)]/20 disabled:opacity-60"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} · {costTierLabels[model.cost]}
                  {model.imageSupport ? "" : " · Text only"}
                  {model.id === DEFAULT_MODEL_ID ? " (default)" : ""}
                </option>
              ))}
            </select>

            <div className="mt-3 flex flex-wrap gap-2">
              {models.map((model) => (
                <span
                  key={model.id}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
                    model.id === defaultModelId
                      ? "bg-[var(--brand-soft)] text-[var(--brand-strong)] ring-[var(--brand)]/20"
                      : "bg-white text-[var(--text-muted)] ring-slate-200/70"
                  }`}
                >
                  {model.name}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${costTierStyles[model.cost]}`}
                  >
                    {model.cost}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Native
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Read-only. Resolved from server environment variables.
            </p>

            <dl className="mt-3 divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70">
              <NativeInfoRow label="Base URL" value={native.baseUrl} />
              <NativeInfoRow label="Base model" value={native.model} />
              <NativeInfoRow
                label="AI image support"
                value={native.imageSupport ? "Enabled" : "Disabled"}
              />
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
