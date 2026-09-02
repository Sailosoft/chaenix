"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import {
  deleteLocalChatSnapshot,
  listLocalChats,
  renameLocalChat,
} from "@/lib/chat-client-store";

type LocalHistoryItem = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview: string;
};

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function HistoryUi() {
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingChatId, setIsDeletingChatId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [historyItems, setHistoryItems] = useState<LocalHistoryItem[]>([]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const chats = await listLocalChats();

      if (!active) {
        return;
      }

      setHistoryItems(chats);
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleDeleteConversation(chatId: string): Promise<void> {
    if (isDeletingChatId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this local conversation cache? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingChatId(chatId);

    try {
      await deleteLocalChatSnapshot(chatId);
      setHistoryItems((current) => current.filter((item) => item.id !== chatId));
    } finally {
      setIsDeletingChatId(null);
    }
  }

  function startRename(chat: LocalHistoryItem): void {
    setRenamingChatId(chat.id);
    setRenameValue(chat.title || "Untitled Chat");
  }

  async function handleSaveRename(chatId: string): Promise<void> {
    const trimmedTitle = renameValue.trim();

    if (!trimmedTitle) {
      return;
    }

    await renameLocalChat(chatId, trimmedTitle);
    setHistoryItems((current) =>
      current.map((item) => (item.id === chatId ? { ...item, title: trimmedTitle } : item)),
    );
    setRenamingChatId(null);
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4">
      <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-[0_4px_24px_-4px_rgba(100,130,180,0.18),0_0_0_1px_rgba(200,215,240,0.25)] backdrop-blur-sm">
        <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--brand-soft)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-[var(--brand)]">
                <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <p className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
              Chat History
            </p>
          </div>
          <Link
            href="/admin/chat"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_-2px_rgba(53,95,159,0.45)] transition-all hover:bg-[var(--brand-strong)] hover:shadow-[0_4px_14px_-3px_rgba(53,95,159,0.5)] active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            New Chat
          </Link>
        </header>

        <div className="h-[70vh] min-h-[300px] max-h-[680px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
              <p className="text-xs text-[var(--text-muted)]">Loading local history...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-soft)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-[var(--text-muted)]/50">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-muted)]">No cached chats yet.</p>
            </div>
          ) : (
            <Virtuoso
              totalCount={historyItems.length}
              itemContent={(index) => {
                const chat = historyItems[index];
                const isRenaming = renamingChatId === chat.id;

                return (
                  <div className="group">
                    <div className="px-6 py-3.5 transition-colors hover:bg-[var(--surface-soft)]/50">
                      <div className="flex items-start gap-3">
                        {isRenaming ? (
                          <input
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                void handleSaveRename(chat.id);
                              }
                              if (event.key === "Escape") {
                                setRenamingChatId(null);
                              }
                            }}
                            autoFocus
                            className="min-w-0 flex-1 rounded-xl border border-[var(--brand)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none shadow-[0_0_0_3px_rgba(53,95,159,0.1)]"
                          />
                        ) : (
                          <Link
                            href={`/admin/chat/${chat.id}`}
                            className="min-w-0 flex-1 transition-opacity hover:opacity-80"
                          >
                            <p className="truncate text-[13px] font-semibold leading-snug text-[var(--text-primary)]">
                              {chat.title || "Untitled Chat"}
                            </p>
                            <p className="mt-1 truncate text-xs leading-relaxed text-[var(--text-muted)]">
                              {chat.lastMessagePreview || "No messages yet"}
                            </p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]/80">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                              </svg>
                              {new Date(chat.updatedAt).toLocaleString()}
                              <span className="text-[var(--text-muted)]/40">&bull;</span>
                              <span>{chat.messageCount} messages</span>
                            </p>
                          </Link>
                        )}

                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {isRenaming ? (
                            <button
                              type="button"
                              disabled={!renameValue.trim()}
                              onClick={() => void handleSaveRename(chat.id)}
                              className="rounded-xl bg-[var(--brand)] p-1.5 text-white shadow-[0_2px_6px_-1px_rgba(53,95,159,0.4)] transition-all hover:bg-[var(--brand-strong)] hover:shadow-[0_3px_10px_-2px_rgba(53,95,159,0.5)] disabled:cursor-not-allowed disabled:opacity-30"
                              title="Save"
                            >
                              <CheckIcon />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startRename(chat)}
                              className="rounded-xl border border-slate-200 bg-white p-1.5 text-[var(--text-muted)] shadow-[0_1px_3px_-1px_rgba(100,130,180,0.15)] transition-all hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] hover:shadow-[0_2px_8px_-2px_rgba(53,95,159,0.2)]"
                              title="Rename"
                            >
                              <PencilIcon />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isDeletingChatId === chat.id}
                            onClick={() => void handleDeleteConversation(chat.id)}
                            className="rounded-xl border border-red-200/60 bg-red-50/80 p-1.5 text-red-400 shadow-[0_1px_3px_-1px_rgba(220,80,100,0.1)] transition-all hover:border-red-300/70 hover:bg-red-100/70 hover:text-[var(--danger-text)] hover:shadow-[0_2px_8px_-2px_rgba(220,80,100,0.15)] disabled:cursor-not-allowed disabled:opacity-30"
                            title="Delete"
                          >
                            {isDeletingChatId === chat.id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 animate-spin">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                            ) : (
                              <TrashIcon />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    {index < historyItems.length - 1 ? (
                      <div className="mx-6 border-b border-slate-200/50" />
                    ) : null}
                  </div>
                );
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
