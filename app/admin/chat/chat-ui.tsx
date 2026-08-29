"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { marked } from "marked";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  listLocalChats,
  loadLocalChatSnapshot,
  saveLocalChatSnapshot,
} from "@/lib/chat-client-store";

type ChatUiProps = {
  id: string;
  initialMessages: UIMessage[];
};

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-chat-ui",
  weight: ["400", "500", "700"],
});

marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
});

function parseMarkdown(text: string): string {
  const escapedText = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  return marked.parse(escapedText, { async: false }) as string;
}

export function ChatUi({ id, initialMessages }: ChatUiProps) {
  const [input, setInput] = useState("");
  const [isLocalCacheReady, setIsLocalCacheReady] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<
    Array<{
      id: string;
      title: string;
      updatedAt: number;
      messageCount: number;
      lastMessagePreview: string;
    }>
  >([]);
  const hasLoadedLocalCache = useRef(false);

  const { messages, sendMessage, setMessages, status } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages: pendingMessages, id: chatId }) {
        return {
          body: {
            id: chatId,
            messages: pendingMessages,
          },
        };
      },
    }),
  });

  useEffect(() => {
    let isActive = true;

    hasLoadedLocalCache.current = false;
    setIsLocalCacheReady(false);

    void (async () => {
      try {
        const localMessages = await loadLocalChatSnapshot(id);

        if (!isActive || localMessages.length === 0) {
          return;
        }

        setMessages((currentMessages) => {
          if (currentMessages.length >= localMessages.length) {
            return currentMessages;
          }

          return localMessages;
        });
      } finally {
        if (isActive) {
          hasLoadedLocalCache.current = true;
          setIsLocalCacheReady(true);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [id, setMessages]);

  useEffect(() => {
    if (!hasLoadedLocalCache.current) {
      return;
    }

    void saveLocalChatSnapshot({
      chatId: id,
      messages,
    });
  }, [id, messages]);

  useEffect(() => {
    if (!isHistoryOpen) {
      return;
    }

    let active = true;

    void (async () => {
      const chats = await listLocalChats();

      if (!active) {
        return;
      }

      setHistoryItems(chats);
    })();

    return () => {
      active = false;
    };
  }, [id, messages, isHistoryOpen]);

  const isSending = status === "submitted" || status === "streaming";

  const placeholder = useMemo(() => {
    if (isSending) {
      return "Generating response...";
    }

    return "Ask something about your project...";
  }, [isSending]);

  const historyButtonLabel = useMemo(() => {
    if (!isHistoryOpen) {
      return "History";
    }

    return "Close History";
  }, [isHistoryOpen]);

  return (
    <main className={`${uiFont.variable} [font-family:var(--font-chat-ui)]`}>
      <section className="mx-auto w-full max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-900">Admin Chat</p>
            <p className="mt-1 break-all text-xs text-slate-500">ID: {id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Cache: {isLocalCacheReady ? "ready" : "syncing"}
            </p>

            <button
              type="button"
              onClick={() => setIsHistoryOpen((current) => !current)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {historyButtonLabel}
            </button>

            <Link
              href="/admin/chat"
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              New Chat
            </Link>
          </div>
        </header>

        {isHistoryOpen ? (
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Chat History
            </p>

            {historyItems.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No cached chats yet.</p>
            ) : (
              <ul className="mt-2 max-h-44 space-y-2 overflow-y-auto">
                {historyItems.map((chat) => {
                  const isActiveChat = chat.id === id;

                  return (
                    <li key={chat.id}>
                      <Link
                        href={`/admin/chat/${chat.id}`}
                        className={`block rounded-lg border px-3 py-2 text-sm transition ${
                          isActiveChat
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                        }`}
                      >
                        <p className="truncate font-semibold">{chat.title || "Untitled Chat"}</p>
                        <p
                          className={`mt-1 truncate text-xs ${
                            isActiveChat ? "text-slate-100" : "text-slate-500"
                          }`}
                        >
                          {chat.lastMessagePreview || "No messages yet"}
                        </p>
                        <p
                          className={`mt-1 text-[11px] ${
                            isActiveChat ? "text-slate-200" : "text-slate-400"
                          }`}
                        >
                          {new Date(chat.updatedAt).toLocaleString()} · {chat.messageCount} messages
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        ) : null}

        <article>
          <div className="max-h-[62vh] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            {messages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                Start the conversation with your first prompt.
              </p>
            ) : null}

            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "ml-auto w-fit max-w-[85%] bg-slate-900 text-white"
                      : "mr-auto max-w-[90%] border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type !== "text") {
                      return null;
                    }

                    return (
                      <div
                        key={`${message.id}-${index}`}
                        className="space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/15 [&_pre]:p-2 [&_ul]:list-disc [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(part.text) }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();

              const value = input.trim();
              if (!value || isSending) {
                return;
              }

              sendMessage({ text: value });
              setInput("");
            }}
          >
            <input
              value={input}
              disabled={isSending}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            />
            <button
              type="submit"
              disabled={isSending}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSending ? "Sending" : "Send"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
