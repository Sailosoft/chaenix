import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_0%_20%,#f973161c_0%,transparent_42%),radial-gradient(circle_at_90%_0%,#f59e0b2e_0%,transparent_35%),linear-gradient(180deg,#f7f4ef_0%,#efe4d3_100%)]">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-amber-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-44 h-80 w-80 rounded-full bg-orange-300/35 blur-3xl" />

      <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pt-20">
        <div className="space-y-8">
          <span className="inline-flex items-center rounded-full border border-amber-900/15 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 shadow-sm backdrop-blur">
            Crafted Operations Platform
          </span>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-5xl font-black tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
              Brewed For Speed.
              <span className="block bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Built For Precision.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-700 sm:text-xl">
              Velyx Coffee centralizes your cafe operations into one modern
              command center, from staff shifts and quality controls to daily
              performance insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/admin"
              className="rounded-2xl bg-stone-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-amber-50 shadow-[0_18px_35px_-20px_rgba(17,24,39,0.8)] transition hover:-translate-y-0.5 hover:bg-black"
            >
              Launch Dashboard
            </Link>
            <Link
              href="/auth/signin?callbackUrl=/admin"
              className="rounded-2xl border border-stone-900/15 bg-white/85 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-stone-800 transition hover:bg-white"
            >
              Sign In
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.15em] text-stone-500">Stores</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">24</p>
            </article>
            <article className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.15em] text-stone-500">Orders Today</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">4.8K</p>
            </article>
            <article className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.15em] text-stone-500">Satisfaction</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">98.4%</p>
            </article>
          </div>
        </div>

        <aside className="relative">
          <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-b from-amber-200/55 via-orange-200/30 to-transparent blur-xl" />
          <div className="relative space-y-5 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_28px_60px_-34px_rgba(120,53,15,0.55)] backdrop-blur-xl sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                Daily Roastery Pulse
              </p>
              <h2 className="mt-2 text-3xl font-bold text-stone-900">
                Real-time visibility for every shift.
              </h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-900/10 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <p className="text-sm font-semibold text-stone-800">Bean Inventory</p>
                <p className="mt-1 text-xs text-stone-600">Healthy stock, reorder in 3 days</p>
              </div>
              <div className="rounded-2xl border border-amber-900/10 bg-gradient-to-r from-orange-50 to-rose-50 p-4">
                <p className="text-sm font-semibold text-stone-800">Peak Traffic Window</p>
                <p className="mt-1 text-xs text-stone-600">07:15 - 09:40 with +14% morning growth</p>
              </div>
              <div className="rounded-2xl border border-amber-900/10 bg-gradient-to-r from-yellow-50 to-amber-50 p-4">
                <p className="text-sm font-semibold text-stone-800">Service Health</p>
                <p className="mt-1 text-xs text-stone-600">Order queue stable across all storefronts</p>
              </div>
            </div>

            <Link
              href="/admin"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:brightness-110"
            >
              Enter Control Deck
            </Link>
          </div>
        </aside>
      </section>

      <section className="relative border-t border-amber-900/10 bg-white/45 py-10 backdrop-blur-sm">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-6 text-sm text-stone-700 md:grid-cols-3">
          <p className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
            Built for boutique cafes and multi-location coffee groups.
          </p>
          <p className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
            Secure sign-in, role-aware routes, and operator-focused UI patterns.
          </p>
          <p className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
            Flexible foundation for menus, logistics, and financial reporting.
          </p>
        </div>
      </section>
    </main>
  );
}
