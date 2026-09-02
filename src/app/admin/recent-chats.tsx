"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listLocalChats } from "@/lib/chat-client-store";

type ChatRecord = {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview: string;
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function RecentChats() {
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      try {
        const allChats = await listLocalChats();
        setChats(allChats.slice(0, 5));
      } catch {
        // Silently handle errors
      } finally {
        setIsLoading(false);
      }
    }

    loadChats();
  }, []);

  if (isLoading) {
    return (
      <div className="mt-4 space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
            <div className="h-3.5 w-3/4 rounded-md bg-neutral-200/60" />
            <div className="mt-2 h-3 w-1/2 rounded-md bg-neutral-200/40" />
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/30 p-10 text-center">
        <svg
          className="mx-auto h-10 w-10 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
        <p className="mt-3 text-sm font-medium text-neutral-400 [font-family:var(--font-body)]">
          No conversations yet
        </p>
        <p className="mt-1 text-[13px] text-neutral-300 [font-family:var(--font-body)]">
          Start chatting to see your history here
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-1.5">
      {chats.map((chat) => (
        <Link
          key={chat.id}
          href={`/admin/chat/${chat.id}`}
          className="group flex items-start justify-between gap-4 rounded-2xl border border-transparent p-3.5 transition-all duration-150 hover:bg-[var(--brand-soft)]/40 hover:border-[var(--brand-soft)]"
        >
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px] font-medium text-neutral-800 group-hover:text-[var(--brand)] [font-family:var(--font-body)]">
              {chat.title}
            </h3>
            <p className="mt-0.5 truncate text-[13px] text-neutral-400 [font-family:var(--font-body)]">
              {chat.lastMessagePreview || "No messages yet"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-[12px] text-neutral-300 [font-family:var(--font-body)]">
              {formatRelativeTime(chat.updatedAt)}
            </span>
            <span className="text-[12px] text-neutral-300 [font-family:var(--font-body)]">
              {chat.messageCount} {chat.messageCount === 1 ? "msg" : "msgs"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
