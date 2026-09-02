import Link from "next/link";
import { MessageSquareText, BarChart3, FolderOpen, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const quickActions: {
  title: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    title: "AI Chat Assistant",
    detail: "Get instant answers and support",
    icon: MessageSquareText,
  },
  {
    title: "Daily Job Reports",
    detail: "Track your work in real time",
    icon: BarChart3,
  },
  {
    title: "File Management",
    detail: "Organize and secure your files",
    icon: FolderOpen,
  },
  {
    title: "Reminders & Notifications",
    detail: "Stay on top of your tasks",
    icon: Bell,
  },
];

const reportItems = [
  { label: "Tasks Completed", value: "5" },
  { label: "Hours Worked", value: "8 hrs" },
  { label: "Notes", value: "Finished project milestone" },
];

const recentFiles = [
  { name: "Monthly_Report.pdf", size: "2.4 MB", date: "Today" },
  { name: "Project_Plan.docx", size: "1.1 MB", date: "Yesterday" },
  { name: "Team_Photo.jpg", size: "3.8 MB", date: "2 days ago" },
  { name: "Backup_Archive.zip", size: "12.6 MB", date: "1 week ago" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#355f9f]/[0.07] blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[500px] w-[500px] rounded-full bg-[#355f9f]/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#355f9f]/[0.04] blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="text-center" id="chat">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#355f9f]/20 bg-[#355f9f]/[0.06] px-4 py-1.5 text-xs font-medium text-[#355f9f] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#355f9f] animate-pulse" />
            Now available
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-[#355f9f] to-[#274d88] bg-clip-text text-transparent">
              Chaeni
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500 sm:text-xl">
            Your smart work companion. Manage tasks, reports, and files — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signin?callbackUrl=/admin"
              className="group relative inline-flex items-center gap-2 rounded-xl bg-[#355f9f] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#355f9f]/25 transition-all duration-200 hover:bg-[#274d88] hover:shadow-[#355f9f]/40"
            >
              Get Started
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-8 py-3.5 text-sm font-semibold text-slate-600 backdrop-blur-sm transition-all duration-200 hover:border-[#355f9f]/30 hover:bg-[#355f9f]/[0.04] hover:text-[#355f9f]"
            >
              Learn more
            </a>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-20" id="features">
          <div className="mb-8 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#355f9f]">Features</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Everything you need</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <article
                  key={action.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:border-[#355f9f]/20 hover:shadow-md hover:shadow-[#355f9f]/[0.06]"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#355f9f]/[0.08] text-[#355f9f] ring-1 ring-[#355f9f]/10">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{action.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{action.detail}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Reports / Files / Chat */}
        <section className="mt-20 grid gap-5 md:grid-cols-3" id="reports">
          {/* Report */}
          <article className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-[#355f9f]/[0.08] flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-[#355f9f]" strokeWidth={1.8} />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Today&apos;s Report</h2>
            </div>
            <div className="space-y-3">
              {reportItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition-all duration-200 hover:border-[#355f9f]/30 hover:bg-[#355f9f]/[0.04] hover:text-[#355f9f]"
            >
              View Full Report
            </button>
          </article>

          {/* Recent Files */}
          <article className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#355f9f]/[0.08] flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-[#355f9f]" strokeWidth={1.8} />
                </div>
                <h2 className="text-base font-semibold text-slate-900">Recent Files</h2>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-slate-400 transition-colors duration-200 hover:text-[#355f9f]"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <div key={file.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 transition-colors duration-200 hover:bg-[#355f9f]/[0.04] cursor-pointer">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-[#355f9f] ring-1 ring-slate-200/60">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-900">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{file.size} · {file.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Chat Preview */}
          <article className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm" id="contact">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-[#355f9f]/[0.08] flex items-center justify-center">
                <MessageSquareText className="h-4 w-4 text-[#355f9f]" strokeWidth={1.8} />
              </div>
              <h2 className="text-base font-semibold text-slate-900">Chat History</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-medium text-slate-400 mb-1">You</p>
                <p className="text-xs text-slate-700">&quot;Send me the latest report to Mary.&quot;</p>
              </div>
              <div className="rounded-xl bg-[#355f9f]/[0.06] px-4 py-3">
                <p className="text-[10px] font-medium text-[#355f9f] mb-1">Chaeni</p>
                <p className="text-xs text-slate-700">&quot;Sure! Here is the summary of the latest report.&quot;</p>
              </div>
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-[#355f9f] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#355f9f]/20 transition-all duration-200 hover:bg-[#274d88] hover:shadow-[#355f9f]/30"
            >
              Start Chat
            </button>
          </article>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-slate-200/60 pt-10" id="about">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">About</h3>
              <ul className="mt-3 space-y-2">
                {["About Us", "Support", "Blog"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs text-slate-400 transition-colors duration-200 hover:text-[#355f9f]">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
              <ul className="mt-3 space-y-2">
                {["Privacy Policy", "Terms of Service"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs text-slate-400 transition-colors duration-200 hover:text-[#355f9f]">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Follow Us</h3>
              <div className="mt-3 flex items-center gap-3">
                {["f", "t", "in"].map((icon) => (
                  <a
                    key={icon}
                    href="#"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-xs font-bold text-slate-400 ring-1 ring-slate-200/60 transition-all duration-200 hover:bg-[#355f9f]/[0.08] hover:text-[#355f9f] hover:ring-[#355f9f]/20"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">
            &copy; 2026 Chaeni. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
