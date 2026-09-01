"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { marked } from "marked";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";

import {
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
  const [localCacheReadyId, setLocalCacheReadyId] = useState<string | null>(null);
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
          setLocalCacheReadyId(id);
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

  const isSending = status === "submitted" || status === "streaming";
  const isLocalCacheReady = localCacheReadyId === id;

  const placeholder = useMemo(() => {
    if (isSending) {
      return "Generating response...";
    }

    return "Ask something about your project...";
  }, [isSending]);

  return (
    <main className={`${uiFont.variable} [font-family:var(--font-chat-ui)]`}>
      <section className="mx-auto w-full max-w-4xl space-y-4 rounded-2xl border border-[var(--border)] bg-white/88 p-4 shadow-[0_20px_44px_-34px_rgba(39,77,136,0.42)] sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">Admin Chat</p>
            <p className="mt-1 break-all text-xs text-[var(--text-muted)]">ID: {id}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              Cache: {isLocalCacheReady ? "ready" : "syncing"}
            </p>

            <Link
              href="/admin/history"
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]"
            >
              History
            </Link>

            <Link
              href="/admin/chat"
              className="rounded-xl bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              New Chat
            </Link>
          </div>
        </header>

        <article>
          <div className="max-h-[62vh] space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 sm:p-4">
            {messages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-secondary)]">
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
                      ? "ml-auto w-fit max-w-[85%] bg-[var(--brand)] text-white"
                      : "mr-auto max-w-[90%] border border-[var(--border)] bg-white text-[var(--text-primary)]"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type !== "text") {
                      return null;
                    }

                    return (
                      <div
                        key={`${message.id}-${index}`}
                        className="space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-[var(--brand-strong)] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-[var(--surface-muted)] [&_code]:px-1 [&_code]:py-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[var(--border)] [&_pre]:bg-[var(--surface-soft)] [&_pre]:p-2 [&_ul]:list-disc [&_ul]:pl-5"
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
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--focus-ring)]"
            />
            <button
              type="submit"
              disabled={isSending}
              className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSending ? "Sending" : "Send"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
