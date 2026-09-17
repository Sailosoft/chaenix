"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { DRIVE_QUOTA_BYTES, DRIVE_QUOTA_MB } from "@/lib/drive-quota";

const USED_COLOR = "#355f9f";
const OVER_COLOR = "#8f2d45";
const REMAINING_COLOR = "#dbe7fa";

function formatMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);

  if (mb >= 100) {
    return `${Math.round(mb)} MB`;
  }

  if (mb >= 10) {
    return `${mb.toFixed(1)} MB`;
  }

  return `${mb.toFixed(2)} MB`;
}

export function StorageUsage() {
  const [usedBytes, setUsedBytes] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const res = await fetch("/api/drive/usage");
        const data = (await res.json()) as { usedBytes?: number; error?: string };

        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load storage usage.");
        }

        if (active) {
          setUsedBytes(Number.isFinite(data.usedBytes) ? Number(data.usedBytes) : 0);
        }
      } catch (err) {
        console.error("[StorageUsage] loading drive usage failed:", err);

        if (active) {
          setFailed(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        <div className="mx-auto h-32 w-32 animate-pulse rounded-full bg-neutral-100" />
        <div className="mx-auto h-3 w-32 animate-pulse rounded-md bg-neutral-200/60" />
      </div>
    );
  }

  if (failed || usedBytes === null) {
    return (
      <p className="mt-4 text-[13px] text-neutral-400 [font-family:var(--font-body)]">
        Storage usage is unavailable right now.
      </p>
    );
  }

  const isOver = usedBytes >= DRIVE_QUOTA_BYTES;
  const used = Math.min(usedBytes, DRIVE_QUOTA_BYTES);
  const remaining = Math.max(DRIVE_QUOTA_BYTES - usedBytes, 0);
  const percent = Math.min(Math.max((usedBytes / DRIVE_QUOTA_BYTES) * 100, 0), 100);
  const data = [
    { name: "Used", value: used },
    { name: "Remaining", value: remaining },
  ];

  return (
    <div className="mt-4">
      <div className="relative mx-auto h-32 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={isOver ? OVER_COLOR : USED_COLOR} />
              <Cell fill={REMAINING_COLOR} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-lg font-semibold [font-family:var(--font-heading)] ${isOver ? "text-[#8f2d45]" : "text-neutral-900"}`}
          >
            {Math.round(percent)}%
          </span>
          <span className="text-[11px] text-neutral-400 [font-family:var(--font-body)]">
            used
          </span>
        </div>
      </div>
      <p className="mt-4 text-center text-[13px] text-neutral-500 [font-family:var(--font-body)]">
        <span className={isOver ? "font-semibold text-[#8f2d45]" : "font-semibold text-neutral-800"}>
          {formatMb(usedBytes)}
        </span>{" "}
        of {DRIVE_QUOTA_MB} MB used
      </p>
    </div>
  );
}
