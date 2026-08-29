import { blogRecords } from "./blog-records";

const categoryClassName: Record<string, string> = {
	Operations: "border-[#c1d5f4] bg-[#e8f1ff] text-[#244575]",
	Growth: "border-[#c8daf6] bg-[#edf4ff] text-[#2f517f]",
	Product: "border-[#b7cdef] bg-[#dceaff] text-[#1f3f6e]",
	Culture: "border-[#d2e1f7] bg-[#f1f6ff] text-[#385988]",
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
		<main className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_0%_0%,rgba(173,197,232,0.3)_0%,transparent_34%),radial-gradient(circle_at_92%_12%,rgba(198,215,240,0.35)_0%,transparent_32%),linear-gradient(180deg,#f8fbff_0%,#edf4ff_72%,#ffffff_100%)]">
			<div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#cadcf7]/40 blur-3xl" />
			<div className="pointer-events-none absolute -right-32 top-52 h-96 w-96 rounded-full bg-[#dbe8fb]/45 blur-3xl" />

			<section className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-14 lg:pt-20">
				<div className="max-w-3xl space-y-5">
					<span className="inline-flex items-center rounded-full border border-(--border) bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--text-secondary) shadow-sm backdrop-blur">
						{blogRecords.hero.badge}
					</span>
					<h1 className="text-4xl font-black tracking-tight text-(--text-primary) sm:text-5xl lg:text-6xl">
						{blogRecords.hero.title}
					</h1>
					<p className="max-w-2xl text-lg leading-8 text-(--text-secondary) sm:text-xl">
						{blogRecords.hero.description}
					</p>
				</div>

				{featured ? (
					  <article className="mt-10 rounded-4xl border border-(--border) bg-white/82 p-6 shadow-[0_28px_60px_-36px_rgba(39,77,136,0.42)] backdrop-blur-xl sm:p-8">
						<div className="flex flex-wrap items-center gap-3">
							<span
								className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${categoryClassName[featured.category]}`}
							>
								{featured.category}
							</span>
							<span className="text-xs font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
								Featured Note
							</span>
						</div>

						<h2 className="mt-5 text-2xl font-bold text-(--text-primary) sm:text-3xl">
							{featured.title}
						</h2>
						<p className="mt-3 max-w-3xl text-base leading-7 text-(--text-secondary) sm:text-lg">
							{featured.excerpt}
						</p>

						<div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-(--text-secondary)">
							<span className="rounded-xl bg-(--surface-soft) px-3 py-1.5">By {featured.author}</span>
							<span className="rounded-xl bg-(--surface-soft) px-3 py-1.5">
								{formatPublishedDate(featured.publishedAt)}
							</span>
							<span className="rounded-xl bg-(--surface-soft) px-3 py-1.5">
								{featured.readMinutes} min read
							</span>
						</div>
					</article>
				) : null}

				<div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{entries.map((record) => (
						<article
							key={record.id}
							className="group rounded-3xl border border-(--border) bg-white/78 p-5 shadow-[0_16px_35px_-26px_rgba(39,77,136,0.42)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_28px_55px_-28px_rgba(39,77,136,0.42)]"
						>
							<div className="flex items-center justify-between gap-3">
								<span
									className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${categoryClassName[record.category]}`}
								>
									{record.category}
								</span>
								<span className="text-[11px] font-medium uppercase tracking-widest text-(--text-muted)">
									{record.readMinutes}m
								</span>
							</div>

							<h3 className="mt-4 text-xl font-bold leading-7 text-(--text-primary) transition group-hover:text-(--brand-strong)">
								{record.title}
							</h3>
							<p className="mt-3 text-sm leading-6 text-(--text-secondary)">{record.excerpt}</p>

							<div className="mt-5 border-t border-(--border) pt-4 text-sm text-(--text-muted)">
								<p className="font-semibold text-(--text-secondary)">{record.author}</p>
								<p>{formatPublishedDate(record.publishedAt)}</p>
							</div>
						</article>
					))}
				</div>
			</section>
		</main>
	);
}
