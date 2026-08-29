import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden bg-[#0c2f59] text-white">
      <section
        className="relative flex min-h-[86vh] items-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(9, 41, 83, 0.86) 0%, rgba(9, 41, 83, 0.72) 35%, rgba(8, 35, 71, 0.68) 100%), url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <button
          type="button"
          aria-label="Previous"
          className="absolute left-4 top-1/2 hidden -translate-y-1/2 text-6xl font-light text-white/90 transition hover:text-white md:block"
        >
          ‹
        </button>

        <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-32 md:pt-36">
          <div className="max-w-5xl text-center md:text-left">
            <p className="text-3xl font-semibold leading-tight tracking-[0.02em] text-white/95 md:text-5xl">
              BREWED FOR SPEED.
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-7xl">
              BUILT FOR PRECISION.
            </h1>

            <p className="mt-8 text-lg font-semibold leading-relaxed text-white/90 md:text-4xl md:leading-relaxed md:font-bold">
              Chaeni App unifies operations into one clear control layer, from
              shifts and quality checks to live service performance.
            </p>
            <p className="mt-3 text-2xl font-bold text-[#7fd3ff] md:text-5xl">
              Real-time visibility, all day, every day
            </p>

            <div className="mt-10">
              <Link
                href="#about"
                className="inline-flex min-w-64 items-center justify-center bg-[#0d5f9a] px-8 py-4 text-2xl font-bold text-white shadow-[0_20px_45px_-18px_rgba(5,20,54,0.8)] transition hover:bg-[#0f6fb4]"
              >
                Explore Chaeni App
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Next"
          className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-6xl font-light text-white/90 transition hover:text-white md:block"
        >
          ›
        </button>
      </section>

      <section className="bg-white px-6 py-16 text-slate-800" id="about">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-[#0d3b70] md:text-4xl">
            A modern operations platform for service-first teams
          </h2>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600">
            Chaeni App helps your team coordinate people, process, and
            performance from one workspace so decisions are faster and daily
            operations stay consistent across every location.
          </p>
        </div>
      </section>

      <section className="bg-[#f5f9ff] px-6 py-14 text-slate-800" id="services">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-2xl font-bold text-[#0d3b70]">Services</h3>
        </div>
      </section>

      <section className="bg-white px-6 py-14 text-slate-800" id="industries">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-2xl font-bold text-[#0d3b70]">Industries</h3>
        </div>
      </section>

      <section className="bg-[#f5f9ff] px-6 py-14 text-slate-800" id="resources">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-2xl font-bold text-[#0d3b70]">Resources</h3>
        </div>
      </section>

      <section className="bg-white px-6 py-14 text-slate-800" id="contact">
        <div className="mx-auto max-w-6xl">
          <h3 className="text-2xl font-bold text-[#0d3b70]">Contact Us</h3>
        </div>
      </section>
    </main>
  );
}
