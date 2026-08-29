import { blogRecords } from "./blog-records";

const categoryClassName: Record<string, string> = {
	Operations: "bg-sky-100 text-sky-800 border-sky-200",
	Growth: "bg-cyan-100 text-cyan-800 border-cyan-200",
	Product: "bg-blue-100 text-blue-800 border-blue-200",
	Culture: "bg-teal-100 text-teal-800 border-teal-200",
};

function formatPublishedDate(value: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	}).format(new Date(value));
}

export default function BlogPage() {
	const [featured, ...entries] = blogRecords.records;

	return (
		<main className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#93c5fd30_0%,transparent_34%),radial-gradient(circle_at_92%_12%,#67e8f93d_0%,transparent_32%),linear-gradient(180deg,#f8fbff_0%,#e7f5ff_72%,#ffffff_100%)]">
			<div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl" />
			<div className="pointer-events-none absolute -right-32 top-52 h-96 w-96 rounded-full bg-cyan-200/35 blur-3xl" />

			<section className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-14 lg:pt-20">
				<div className="max-w-3xl space-y-5">
					<span className="inline-flex items-center rounded-full border border-sky-900/15 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-900 shadow-sm backdrop-blur">
						{blogRecords.hero.badge}
					</span>
					<h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
						{blogRecords.hero.title}
					</h1>
					<p className="max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
						{blogRecords.hero.description}
					</p>
				</div>

				{featured ? (
					  <article className="mt-10 rounded-4xl border border-white/80 bg-white/75 p-6 shadow-[0_28px_60px_-34px_rgba(14,116,144,0.45)] backdrop-blur-xl sm:p-8">
						<div className="flex flex-wrap items-center gap-3">
							<span
								className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${categoryClassName[featured.category]}`}
							>
								{featured.category}
							</span>
							<span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
								Featured Note
							</span>
						</div>

						<h2 className="mt-5 text-2xl font-bold text-slate-900 sm:text-3xl">
							{featured.title}
						</h2>
						<p className="mt-3 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
							{featured.excerpt}
						</p>

						<div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-600">
							<span className="rounded-xl bg-slate-100 px-3 py-1.5">By {featured.author}</span>
							<span className="rounded-xl bg-slate-100 px-3 py-1.5">
								{formatPublishedDate(featured.publishedAt)}
							</span>
							<span className="rounded-xl bg-slate-100 px-3 py-1.5">
								{featured.readMinutes} min read
							</span>
						</div>
					</article>
				) : null}

				<div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{entries.map((record) => (
						<article
							key={record.id}
							className="group rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_16px_35px_-24px_rgba(14,116,144,0.45)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_28px_55px_-24px_rgba(14,116,144,0.45)]"
						>
							<div className="flex items-center justify-between gap-3">
								<span
									className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${categoryClassName[record.category]}`}
								>
									{record.category}
								</span>
								<span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
									{record.readMinutes}m
								</span>
							</div>

							<h3 className="mt-4 text-xl font-bold leading-7 text-slate-900 transition group-hover:text-sky-800">
								{record.title}
							</h3>
							<p className="mt-3 text-sm leading-6 text-slate-700">{record.excerpt}</p>

							<div className="mt-5 border-t border-slate-200/80 pt-4 text-sm text-slate-600">
								<p className="font-semibold text-slate-700">{record.author}</p>
								<p>{formatPublishedDate(record.publishedAt)}</p>
							</div>
						</article>
					))}
				</div>
			</section>
		</main>
	);
}
