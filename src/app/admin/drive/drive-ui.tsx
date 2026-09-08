"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DriveEntry = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  isFolder: boolean;
};

type PathSegment = { id: string; name: string };

type UploadState = {
  key: string;
  name: string;
  status: "uploading" | "error";
  error?: string;
  file: File;
  parentId: string | null;
};

type OrderBy = "name" | "modified" | "size";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function isGoogleNative(entry: DriveEntry): boolean {
  return !entry.isFolder && entry.mimeType.startsWith("application/vnd.google-apps.");
}

function formatSize(size?: string): string {
  if (!size) {
    return "—";
  }

  const bytes = Number(size);

  if (!Number.isFinite(bytes)) {
    return "—";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

function FolderIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  );
}

function FileIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

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

function XIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 21h16" />
    </svg>
  );
}

function UploadIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21V9" /><path d="m7 14 5-5 5 5" /><path d="M4 3h16" />
    </svg>
  );
}

function MoveIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function SpinnerIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${className} animate-spin`}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

const rowButtonClass =
  "rounded-xl border border-slate-200 bg-white p-1.5 text-[var(--text-muted)] shadow-[0_1px_3px_-1px_rgba(100,130,180,0.15)] transition-all hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-[var(--text-muted)]";

const dangerButtonClass =
  "rounded-xl border border-red-200/60 bg-red-50/80 p-1.5 text-red-400 shadow-[0_1px_3px_-1px_rgba(220,80,100,0.1)] transition-all hover:border-red-300/70 hover:bg-red-100/70 hover:text-[var(--danger-text)] disabled:cursor-not-allowed disabled:opacity-30";

const primaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_-2px_rgba(53,95,159,0.45)] transition-all hover:bg-[var(--brand-strong)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] shadow-[0_1px_3px_-1px_rgba(100,130,180,0.15)] transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

export function DriveUi() {
  const [pathStack, setPathStack] = useState<PathSegment[]>([]);
  const [listData, setListData] = useState<{
    key: string;
    items: DriveEntry[];
    nextPageToken: string | null;
  } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [orderBy, setOrderBy] = useState<OrderBy>("name");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingBusy, setIsCreatingBusy] = useState(false);

  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isBulkBusy, setIsBulkBusy] = useState(false);
  const [moveModalIds, setMoveModalIds] = useState<string[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentFolderId = pathStack.length > 0 ? pathStack[pathStack.length - 1].id : null;
  const viewKey = `${currentFolderId ?? "root"}|${activeSearch}|${orderBy}`;
  const items = listData?.key === viewKey ? listData.items : [];
  const nextPageToken = listData?.key === viewKey ? listData.nextPageToken : null;
  const isLoading = listData?.key !== viewKey;

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const refresh = useCallback(async () => {
    const key = `${currentFolderId ?? "root"}|${activeSearch}|${orderBy}`;

    try {
      const params = new URLSearchParams();

      if (currentFolderId) {
        params.set("folderId", currentFolderId);
      }

      if (activeSearch) {
        params.set("search", activeSearch);
      }

      params.set("orderBy", orderBy);

      const res = await fetch(`/api/drive/files?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to load files.");
      }

      setError(null);
      setListData({
        key,
        items: data.items as DriveEntry[],
        nextPageToken: (data.nextPageToken as string | null) ?? null,
      });
    } catch (err) {
      setError(errorMessage(err));
      setListData({ key, items: [], nextPageToken: null });
    }
  }, [currentFolderId, activeSearch, orderBy]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleLoadMore(): Promise<void> {
    if (!nextPageToken) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams();

      if (currentFolderId) {
        params.set("folderId", currentFolderId);
      }

      if (activeSearch) {
        params.set("search", activeSearch);
      }

      params.set("orderBy", orderBy);
      params.set("pageToken", nextPageToken);

      const res = await fetch(`/api/drive/files?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to load more files.");
      }

      setError(null);
      setListData((current) =>
        current && current.key === viewKey
          ? {
              ...current,
              items: [...current.items, ...(data.items as DriveEntry[])],
              nextPageToken: (data.nextPageToken as string | null) ?? null,
            }
          : current,
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }

  function clearSelection(): void {
    setSelected(new Set());
  }

  function toggleSelect(id: string): void {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleSelectAllLoaded(): void {
    setSelected((current) => {
      const allLoadedSelected = items.length > 0 && items.every((item) => current.has(item.id));
      const next = new Set(current);

      for (const item of items) {
        if (allLoadedSelected) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      }

      return next;
    });
  }

  function openFolder(entry: DriveEntry): void {
    setPathStack((current) => [...current, { id: entry.id, name: entry.name }]);
    clearSelection();
  }

  function goToCrumb(index: number): void {
    setPathStack((current) => (index < 0 ? [] : current.slice(0, index + 1)));
    clearSelection();
  }

  function startRename(entry: DriveEntry): void {
    setRenamingId(entry.id);
    setRenameValue(entry.name);
  }

  async function handleSaveRename(entry: DriveEntry): Promise<void> {
    const trimmed = renameValue.trim();

    if (!trimmed || trimmed.includes("/")) {
      return;
    }

    try {
      const res = await fetch(`/api/drive/files/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Rename failed.");
      }

      setListData((current) =>
        current && current.key === viewKey
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === entry.id ? (data as DriveEntry) : item,
              ),
            }
          : current,
      );
      setRenamingId(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDelete(entry: DriveEntry): Promise<void> {
    if (isDeletingId) {
      return;
    }

    const shouldDelete = window.confirm(
      `Move "${entry.name}" to the Drive trash? This can be undone from Google Drive.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingId(entry.id);

    try {
      const res = await fetch(`/api/drive/files/${entry.id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Delete failed.");
      }

      setListData((current) =>
        current && current.key === viewKey
          ? { ...current, items: current.items.filter((item) => item.id !== entry.id) }
          : current,
      );
      setSelected((current) => {
        const next = new Set(current);
        next.delete(entry.id);
        return next;
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsDeletingId(null);
    }
  }

  async function handleCreateFolder(): Promise<void> {
    const trimmed = newFolderName.trim();

    if (!trimmed || trimmed.includes("/") || isCreatingBusy) {
      return;
    }

    setIsCreatingBusy(true);

    try {
      const res = await fetch("/api/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          ...(currentFolderId ? { parentId: currentFolderId } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Could not create folder.");
      }

      setIsCreatingFolder(false);
      setNewFolderName("");
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsCreatingBusy(false);
    }
  }

  async function runUpload(upload: UploadState): Promise<void> {
    const { key, file, parentId } = upload;

    try {
      const headers: Record<string, string> = {
        "Content-Type": file.type || "application/octet-stream",
        "X-File-Name": file.name,
      };

      if (parentId) {
        headers["X-Parent-Id"] = parentId;
      }

      const res = await fetch("/api/drive/upload", {
        method: "POST",
        headers,
        body: file,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          (data as { error?: string } | null)?.error ?? "Upload failed.",
        );
      }

      setUploads((current) => current.filter((entry) => entry.key !== key));
      await refresh();
    } catch (err) {
      setUploads((current) =>
        current.map((entry) =>
          entry.key === key
            ? { ...entry, status: "error" as const, error: errorMessage(err) }
            : entry,
        ),
      );
    }
  }

  function handleFiles(fileList: FileList | File[]): void {
    const files = Array.from(fileList);

    if (files.length === 0) {
      return;
    }

    const parentId = currentFolderId;
    const created: UploadState[] = files.map((file, index) => ({
      key: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      status: "uploading" as const,
      file,
      parentId,
    }));

    setUploads((current) => [...current, ...created]);

    for (const upload of created) {
      void runUpload(upload);
    }
  }

  function retryUpload(key: string): void {
    const upload = uploads.find((entry) => entry.key === key);

    if (!upload) {
      return;
    }

    setUploads((current) =>
      current.map((entry) =>
        entry.key === key ? { ...entry, status: "uploading" as const, error: undefined } : entry,
      ),
    );
    void runUpload({ ...upload, status: "uploading", error: undefined });
  }

  async function handleBulkDelete(): Promise<void> {
    const ids = Array.from(selected);

    if (ids.length === 0 || isBulkBusy) {
      return;
    }

    const shouldDelete = window.confirm(
      `Move ${ids.length} item(s) to the Drive trash? This can be undone from Google Drive.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsBulkBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/drive/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Bulk delete failed.");
      }

      if (Array.isArray(data.failed) && data.failed.length > 0) {
        setError(
          `${data.failed.length} item(s) failed to delete: ${(data.failed[0] as { error?: string }).error ?? "unknown error"}`,
        );
      }

      clearSelection();
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsBulkBusy(false);
    }
  }

  async function handleSingleMove(entry: DriveEntry): Promise<void> {
    setMoveModalIds([entry.id]);
  }

  const sortedItems = [...items].sort((a, b) => Number(b.isFolder) - Number(a.isFolder));
  const allLoadedSelected =
    items.length > 0 && items.every((item) => selected.has(item.id));

  return (
    <main className="mx-auto w-full max-w-4xl px-4">
      <section
        className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-[0_4px_24px_-4px_rgba(100,130,180,0.18),0_0_0_1px_rgba(200,215,240,0.25)] backdrop-blur-sm"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget === event.target) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);

          if (event.dataTransfer.files.length > 0) {
            handleFiles(event.dataTransfer.files);
          }
        }}
      >
        <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--brand-soft)]">
              <FolderIcon className="size-4 text-[var(--brand)]" />
            </div>
            <p className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
              Drive Files
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className={secondaryButtonClass}
            title="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
            </svg>
            Refresh
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 bg-white/40 px-6 py-3">
          <button
            type="button"
            onClick={() => {
              setIsCreatingFolder(true);
              setNewFolderName("");
            }}
            className={secondaryButtonClass}
          >
            <FolderIcon className="size-3.5" />
            New folder
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={primaryButtonClass}
          >
            <UploadIcon />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) {
                handleFiles(event.target.files);
              }
              event.target.value = "";
            }}
          />
          <div className="relative ml-auto min-w-[160px] flex-1 sm:max-w-[220px]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this folder…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(53,95,159,0.1)]"
            />
          </div>
          <select
            value={orderBy}
            onChange={(event) => setOrderBy(event.target.value as OrderBy)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[var(--text-secondary)] outline-none transition-all focus:border-[var(--brand)]"
          >
            <option value="name">Sort: Name</option>
            <option value="modified">Sort: Modified</option>
            <option value="size">Sort: Size</option>
          </select>
        </div>

        <nav className="flex flex-wrap items-center gap-1 border-b border-slate-200/60 px-6 py-2.5 text-xs text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => goToCrumb(-1)}
            className={`font-medium transition-colors hover:text-[var(--brand)] ${pathStack.length === 0 ? "text-[var(--text-primary)]" : ""}`}
          >
            Home
          </button>
          {pathStack.map((segment, index) => (
            <span key={segment.id} className="flex items-center gap-1">
              <span className="text-[var(--text-muted)]/40">/</span>
              <button
                type="button"
                onClick={() => goToCrumb(index)}
                className={`max-w-[180px] truncate font-medium transition-colors hover:text-[var(--brand)] ${index === pathStack.length - 1 ? "text-[var(--text-primary)]" : ""}`}
              >
                {segment.name}
              </button>
            </span>
          ))}
        </nav>

        {error ? (
          <div className="mx-6 mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-2.5 text-xs text-[var(--danger-text)]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-red-400 transition-colors hover:text-[var(--danger-text)]"
              aria-label="Dismiss error"
            >
              <XIcon />
            </button>
          </div>
        ) : null}

        {uploads.length > 0 ? (
          <div className="mx-6 mt-4 flex flex-col gap-1.5 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3">
            {uploads.map((upload) => (
              <div key={upload.key} className="flex items-center gap-2 text-xs">
                {upload.status === "uploading" ? (
                  <SpinnerIcon className="size-3.5 text-[var(--brand)]" />
                ) : (
                  <span className="text-red-400">
                    <XIcon />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-primary)]">
                  {upload.name}
                </span>
                {upload.status === "error" ? (
                  <>
                    <span className="max-w-[220px] truncate text-red-400">{upload.error}</span>
                    <button
                      type="button"
                      onClick={() => retryUpload(upload.key)}
                      className={secondaryButtonClass}
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUploads((current) => current.filter((entry) => entry.key !== upload.key))
                      }
                      className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                      aria-label="Dismiss upload"
                    >
                      <XIcon />
                    </button>
                  </>
                ) : (
                  <span className="text-[var(--text-muted)]">Uploading…</span>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {isCreatingFolder ? (
          <div className="mx-6 mt-4 flex items-center gap-2">
            <FolderIcon className="size-4 shrink-0 text-[var(--brand)]" />
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleCreateFolder();
                }
                if (event.key === "Escape") {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
              autoFocus
              placeholder="New folder name"
              className="min-w-0 flex-1 rounded-xl border border-[var(--brand)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none shadow-[0_0_0_3px_rgba(53,95,159,0.1)]"
            />
            <button
              type="button"
              disabled={!newFolderName.trim() || newFolderName.includes("/") || isCreatingBusy}
              onClick={() => void handleCreateFolder()}
              className="rounded-xl bg-[var(--brand)] p-1.5 text-white shadow-[0_2px_6px_-1px_rgba(53,95,159,0.4)] transition-all hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-30"
              title="Create folder"
            >
              {isCreatingBusy ? <SpinnerIcon /> : <CheckIcon />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName("");
              }}
              className="rounded-xl border border-slate-200 bg-white p-1.5 text-[var(--text-muted)] transition-all hover:text-[var(--text-primary)]"
              title="Cancel"
            >
              <XIcon />
            </button>
          </div>
        ) : null}

        {selected.size > 0 ? (
          <div className="mx-6 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-soft)]/50 px-4 py-2.5 text-xs">
            <span className="font-semibold text-[var(--brand)]">
              {selected.size} selected
            </span>
            <button
              type="button"
              disabled={isBulkBusy}
              onClick={() => setMoveModalIds(Array.from(selected))}
              className={secondaryButtonClass}
            >
              <MoveIcon />
              Move
            </button>
            <button
              type="button"
              disabled={isBulkBusy}
              onClick={() => void handleBulkDelete()}
              className={secondaryButtonClass}
            >
              <TrashIcon />
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="min-h-[300px] px-6 py-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="size-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
              <p className="text-xs text-[var(--text-muted)]">Loading files…</p>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-soft)]">
                <FolderIcon className="size-6 text-[var(--text-muted)]/50" />
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {activeSearch ? "No matching items in this folder." : "This folder is empty."}
              </p>
              <p className="text-xs text-[var(--text-muted)]/70">
                Upload files or drop them here.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[28px_minmax(0,1fr)_80px_150px_120px] items-center gap-2 border-b border-slate-200/60 px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={allLoadedSelected}
                  onChange={toggleSelectAllLoaded}
                  aria-label="Select all loaded items"
                  className="size-3.5 accent-[var(--brand)]"
                />
                <span>Name</span>
                <span>Size</span>
                <span className="hidden sm:block">Modified</span>
                <span className="text-right">Actions</span>
              </div>
              {sortedItems.map((entry) => {
                const isSelected = selected.has(entry.id);
                const isRenaming = renamingId === entry.id;
                const native = isGoogleNative(entry);

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[28px_minmax(0,1fr)_80px_150px_120px] items-center gap-2 rounded-xl px-2 py-2.5 text-xs transition-colors hover:bg-[var(--surface-soft)]/60 ${isSelected ? "bg-[var(--brand-soft)]/40" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(entry.id)}
                      aria-label={`Select ${entry.name}`}
                      className="size-3.5 accent-[var(--brand)]"
                    />
                    {isRenaming ? (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <input
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              void handleSaveRename(entry);
                            }
                            if (event.key === "Escape") {
                              setRenamingId(null);
                            }
                          }}
                          autoFocus
                          className="min-w-0 flex-1 rounded-xl border border-[var(--brand)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none shadow-[0_0_0_3px_rgba(53,95,159,0.1)]"
                        />
                        <button
                          type="button"
                          disabled={!renameValue.trim() || renameValue.includes("/")}
                          onClick={() => void handleSaveRename(entry)}
                          className="rounded-xl bg-[var(--brand)] p-1.5 text-white transition-all hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-30"
                          title="Save"
                        >
                          <CheckIcon />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (entry.isFolder) {
                            openFolder(entry);
                          }
                        }}
                        disabled={!entry.isFolder}
                        className={`flex min-w-0 items-center gap-2 text-left ${entry.isFolder ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span
                          className={
                            entry.isFolder
                              ? "shrink-0 text-[var(--brand)]"
                              : "shrink-0 text-[var(--text-muted)]"
                          }
                        >
                          {entry.isFolder ? <FolderIcon /> : <FileIcon />}
                        </span>
                        <span className="truncate font-medium text-[var(--text-primary)]">
                          {entry.name}
                        </span>
                        {native ? (
                          <span className="shrink-0 rounded-md bg-[var(--surface-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                            Google file
                          </span>
                        ) : null}
                      </button>
                    )}
                    <span className="truncate text-[var(--text-muted)]">
                      {entry.isFolder ? "—" : formatSize(entry.size)}
                    </span>
                    <span className="hidden truncate text-[var(--text-muted)] sm:block">
                      {entry.modifiedTime ? new Date(entry.modifiedTime).toLocaleString() : "—"}
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startRename(entry)}
                        className={rowButtonClass}
                        title="Rename"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSingleMove(entry)}
                        className={rowButtonClass}
                        title="Move to…"
                      >
                        <MoveIcon />
                      </button>
                      {entry.isFolder ? null : (
                        <a
                          href={`/api/drive/files/${entry.id}/download`}
                          className={`${rowButtonClass} inline-flex ${native ? "pointer-events-none opacity-30" : ""}`}
                          title={native ? "Google-native files cannot be downloaded in v1" : "Download"}
                          aria-disabled={native}
                        >
                          <DownloadIcon />
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={isDeletingId === entry.id}
                        onClick={() => void handleDelete(entry)}
                        className={dangerButtonClass}
                        title="Move to trash"
                      >
                        {isDeletingId === entry.id ? <SpinnerIcon /> : <TrashIcon />}
                      </button>
                    </div>
                  </div>
                );
              })}
              {nextPageToken ? (
                <div className="flex justify-center py-4">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => void handleLoadMore()}
                    className={secondaryButtonClass}
                  >
                    {isLoadingMore ? <SpinnerIcon /> : null}
                    Load more
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {isDragging ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[var(--brand-soft)]/60 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--brand)] bg-white/90 px-8 py-6 text-[var(--brand)]">
              <UploadIcon className="size-5" />
              <p className="text-sm font-semibold">Drop files to upload here</p>
            </div>
          </div>
        ) : null}
      </section>

      {moveModalIds ? (
        <MoveModal
          ids={moveModalIds}
          currentParentId={currentFolderId}
          onClose={() => setMoveModalIds(null)}
          onDone={() => {
            clearSelection();
            void refresh();
          }}
        />
      ) : null}
    </main>
  );
}

function MoveModal({
  ids,
  currentParentId,
  onClose,
  onDone,
}: {
  ids: string[];
  currentParentId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [stack, setStack] = useState<PathSegment[]>([]);
  const [folderData, setFolderData] = useState<{
    key: string;
    folders: DriveEntry[];
    nextPageToken: string | null;
  } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const folderId = stack.length > 0 ? stack[stack.length - 1].id : null;
  const modalKey = folderId ?? "root";
  const folders = folderData?.key === modalKey ? folderData.folders : [];
  const nextPageToken = folderData?.key === modalKey ? folderData.nextPageToken : null;
  const isLoading = folderData?.key !== modalKey;

  useEffect(() => {
    let active = true;

    void (async () => {
      const key = folderId ?? "root";

      try {
        const params = new URLSearchParams();
        params.set("orderBy", "name");

        if (folderId) {
          params.set("folderId", folderId);
        }

        const res = await fetch(`/api/drive/files?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error ?? "Failed to load folders.");
        }

        if (!active) {
          return;
        }

        setError(null);
        setFolderData({
          key,
          folders: (((data.items as DriveEntry[]) ?? []).filter((item) => item.isFolder)),
          nextPageToken: (data.nextPageToken as string | null) ?? null,
        });
      } catch (err) {
        if (!active) {
          return;
        }

        setError(errorMessage(err));
        setFolderData({ key, folders: [], nextPageToken: null });
      }
    })();

    return () => {
      active = false;
    };
  }, [folderId]);

  async function handleLoadMore(): Promise<void> {
    if (!nextPageToken) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set("orderBy", "name");
      params.set("pageToken", nextPageToken);

      if (folderId) {
        params.set("folderId", folderId);
      }

      const res = await fetch(`/api/drive/files?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to load more folders.");
      }

      setError(null);
      setFolderData((current) =>
        current && current.key === modalKey
          ? {
              ...current,
              folders: [
                ...current.folders,
                ...(((data.items as DriveEntry[]) ?? []).filter((item) => item.isFolder)),
              ],
              nextPageToken: (data.nextPageToken as string | null) ?? null,
            }
          : current,
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function selectThisFolder(): Promise<void> {
    if (!folderId || isMoving) {
      return;
    }

    setIsMoving(true);
    setError(null);

    try {
      const res = await fetch("/api/drive/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", ids, targetId: folderId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Move failed.");
      }

      const failed = (data.failed ?? []) as { id: string; error?: string }[];

      if (Array.isArray(data.moved) && data.moved.length > 0) {
        onDone();
      }

      if (failed.length === 0) {
        onClose();
      } else {
        setError(
          `${failed.length} item(s) failed to move: ${failed[0]?.error ?? "unknown error"}`,
        );
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsMoving(false);
    }
  }

  const selectDisabled =
    !folderId || folderId === currentParentId || ids.includes(folderId) || isMoving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200/60 px-5 py-4">
          <p className="text-sm font-bold text-[var(--text-primary)]">
            Move {ids.length} item{ids.length === 1 ? "" : "s"} to…
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </header>

        <div className="border-b border-slate-200/60 px-5 py-2.5">
          <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text-primary)]">Home</span>
            {stack.map((segment, index) => (
              <span key={segment.id} className="flex items-center gap-1">
                <span className="text-[var(--text-muted)]/40">/</span>
                <button
                  type="button"
                  onClick={() => setStack((current) => current.slice(0, index + 1))}
                  className={`max-w-[160px] truncate font-medium transition-colors hover:text-[var(--brand)] ${index === stack.length - 1 ? "text-[var(--text-primary)]" : ""}`}
                >
                  {segment.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-3 rounded-xl border border-red-200/70 bg-red-50/80 px-3.5 py-2 text-xs text-[var(--danger-text)]">
            {error}
          </div>
        ) : null}

        <div className="min-h-[160px] flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="size-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
              <p className="text-xs text-[var(--text-muted)]">Loading folders…</p>
            </div>
          ) : folders.length === 0 ? (
            <p className="py-10 text-center text-xs text-[var(--text-muted)]">
              No subfolders here.
            </p>
          ) : (
            <>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setStack((current) => [...current, { id: folder.id, name: folder.name }])}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition-colors hover:bg-[var(--surface-soft)]/70"
                >
                  <span className="shrink-0 text-[var(--brand)]">
                    <FolderIcon />
                  </span>
                  <span className="truncate font-medium text-[var(--text-primary)]">
                    {folder.name}
                  </span>
                </button>
              ))}
              {nextPageToken ? (
                <div className="flex justify-center py-2">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => void handleLoadMore()}
                    className={secondaryButtonClass}
                  >
                    {isLoadingMore ? <SpinnerIcon /> : null}
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200/60 px-5 py-4">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            disabled={selectDisabled}
            onClick={() => void selectThisFolder()}
            className={primaryButtonClass}
            title={
              folderId && folderId === currentParentId
                ? "Already in this folder"
                : folderId && ids.includes(folderId)
                  ? "Cannot move an item into itself"
                  : !folderId
                    ? "Open a folder to move into"
                    : undefined
            }
          >
            {isMoving ? <SpinnerIcon /> : null}
            Select this folder
          </button>
        </footer>
      </div>
    </div>
  );
}
