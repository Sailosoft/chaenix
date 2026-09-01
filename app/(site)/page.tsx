import Link from "next/link";

const quickActions = [
  {
    title: "AI Chat Assistant",
    detail: "Get instant answers and support",
    icon: "...",
  },
  {
    title: "Daily Job Reports",
    detail: "Track your work in real time",
    icon: ">>",
  },
  {
    title: "File Management",
    detail: "Organize and secure your files",
    icon: "[]",
  },
  {
    title: "Reminders & Notifications",
    detail: "Stay on top of your tasks",
    icon: "*",
  },
];

const reportItems = [
  "Tasks Completed: 5",
  "Hours Worked: 8 hrs",
  "Notes: Finished project milestone",
];

const recentFiles = [
  "Monthly_Report.pdf",
  "Project_Plan.docx",
  "Team_Photo.jpg",
  "Backup_Archive.zip",
];

export default function Home() {
  return (
    <main
      className="relative flex-1 overflow-hidden bg-background px-4 pb-12 pt-24 text-(--text-primary) sm:px-6 sm:pb-16 sm:pt-28"
      id="home"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(176,198,232,0.4),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(152,177,221,0.34),transparent_35%),linear-gradient(160deg,#f7faff_0%,#eef4ff_58%,#f6f9ff_100%)]" />
      <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-(--border) bg-linear-to-b from-white/94 via-[#f5f9ff]/94 to-[#eef4ff]/94 p-5 shadow-[0_30px_80px_-38px_rgba(39,77,136,0.4)] sm:p-8">
        <section className="text-center" id="chat">
          <h1 className="text-2xl font-black tracking-tight text-(--text-primary) sm:text-4xl">
            Chaeni - Your Smart Work Companion
          </h1>
          <p className="mt-3 text-sm text-(--text-secondary) sm:text-base">
            Manage tasks, reports, and files - all in one place.
          </p>

          <div className="mt-6">
            <Link
              href="/auth/signin?callbackUrl=/admin"
              className="inline-flex items-center rounded-md bg-linear-to-r from-[#5578b0] to-[#355f9f] px-8 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-[0_16px_36px_-20px_rgba(39,77,136,0.82)] transition hover:brightness-110"
            >
              Get Started
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" id="reports">
          {quickActions.map((action) => (
            <article
              key={action.title}
              className="rounded-lg border border-(--border) bg-white/86 p-4 shadow-[0_12px_30px_-20px_rgba(39,77,136,0.3)]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-(--text-secondary)">
                {action.icon} {action.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-(--text-muted)">
                {action.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3" id="files">
          <article className="rounded-lg border border-(--border) bg-white/88 p-4">
            <h2 className="text-lg font-bold text-(--text-primary)">Today&apos;s Report</h2>
            <ul className="mt-3 space-y-2 text-xs text-(--text-secondary)">
              {reportItems.map((item) => (
                <li key={item} className="rounded-md bg-(--surface-soft) px-2 py-1.5">
                  {item}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 inline-flex items-center rounded-md bg-(--brand) px-3 py-2 text-xs font-semibold text-white transition hover:bg-(--brand-strong)"
            >
              View Full Report
            </button>
          </article>

          <article className="rounded-lg border border-(--border) bg-white/88 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-(--text-primary)">Recent Files</h2>
              <button
                type="button"
                className="text-xs font-semibold text-(--text-secondary) transition hover:text-(--text-primary)"
              >
                View All
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-(--text-secondary)">
              {recentFiles.map((fileName) => (
                <li key={fileName} className="rounded-md bg-(--surface-soft) px-2 py-1.5">
                  {fileName}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-lg border border-(--border) bg-white/88 p-4" id="contact">
            <h2 className="text-lg font-bold text-(--text-primary)">Chat History</h2>
            <div className="mt-3 space-y-2 text-xs text-(--text-secondary)">
              <p className="rounded-md bg-(--surface-soft) px-2 py-1.5">
                You: &quot;Send me the latest report to Mary.&quot;
              </p>
              <p className="rounded-md bg-(--surface-soft) px-2 py-1.5">
                Chaeni: &quot;Sure! Here is the summary of the latest report.&quot;
              </p>
            </div>
            <button
              type="button"
              className="mt-4 inline-flex items-center rounded-md bg-(--brand) px-3 py-2 text-xs font-semibold text-white transition hover:bg-(--brand-strong)"
            >
              Start Chat
            </button>
          </article>
        </section>

        <footer className="mt-8 border-t border-(--border) pt-6 text-xs text-(--text-secondary)" id="about">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-bold text-(--text-primary)">About</h3>
              <ul className="mt-2 space-y-1">
                <li>About Us</li>
                <li>Support</li>
                <li>Blog</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-(--text-primary)">Legal</h3>
              <ul className="mt-2 space-y-1">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-(--text-primary)">Follow Us</h3>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-(--brand) font-bold text-white">
                  f
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-(--brand) font-bold text-white">
                  t
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-(--brand) font-bold text-white">
                  in
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 border-t border-(--border) pt-4 text-center text-(--text-muted)">
            @ 2026 Chaeni. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
