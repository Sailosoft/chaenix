"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
    <main className="mx-auto w-full max-w-4xl">
      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/88 p-4 shadow-[0_18px_42px_-34px_rgba(39,77,136,0.4)] sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">Chat History</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Source: local Dexie cache</p>
          </div>

          <Link
            href="/admin/chat"
            className="rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            New Chat
          </Link>
        </header>

        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading local history...</p>
        ) : null}

        {!isLoading && historyItems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No cached chats yet.</p>
        ) : null}

        {historyItems.length > 0 ? (
          <ul className="space-y-2">
            {historyItems.map((chat) => {
              const isRenaming = renamingChatId === chat.id;

              return (
                <li key={chat.id}>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
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
                          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
                        />
                      ) : (
                        <Link href={`/admin/chat/${chat.id}`} className="min-w-0 flex-1 hover:opacity-90">
                          <p className="truncate font-semibold text-[var(--text-primary)]">
                            {chat.title || "Untitled Chat"}
                          </p>
                          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {chat.lastMessagePreview || "No messages yet"}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            {new Date(chat.updatedAt).toLocaleString()} · {chat.messageCount} messages
                          </p>
                        </Link>
                      )}

                      <div className="flex shrink-0 items-center gap-2">
                        {isRenaming ? (
                          <button
                            type="button"
                            disabled={!renameValue.trim()}
                            onClick={() => void handleSaveRename(chat.id)}
                            className="rounded-md bg-[var(--brand)] px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startRename(chat)}
                            className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                          >
                            Rename
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isDeletingChatId === chat.id}
                          onClick={() => void handleDeleteConversation(chat.id)}
                          className="rounded-md border border-[var(--danger-text)]/35 bg-[var(--danger-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--danger-text)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeletingChatId === chat.id ? "Deleting" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
