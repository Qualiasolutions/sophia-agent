import Link from "next/link";
import Image from "next/image";

const featureHighlights = [
  {
    title: "Instant Agent Workflows",
    description:
      "Centralize onboarding, lead follow-up, and compliance tasks with reusable playbooks for every agent.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 17l-4 4m0 0l-4-4m4 4V3"
        />
      </svg>
    ),
    accent: "from-indigo-500 to-purple-500",
  },
  {
    title: "Realtime Client Insights",
    description:
      "Monitor WhatsApp and Telegram touchpoints, document activity, and calculator usage in one command center.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3v5h5M21 21v-5h-5M3 21v-5h5M21 3v5h-5"
        />
      </svg>
    ),
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Secure Operations",
    description:
      "Role-based access, audit-friendly logs, and Supabase-backed storage keep sensitive data protected.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2"
        />
      </svg>
    ),
    accent: "from-amber-500 to-orange-500",
  },
];

const workflowPillars = [
  {
    heading: "Launch Conversational Agents",
    copy: "Deploy branded AI assistants across WhatsApp, Telegram, and web widgets with no-code templates.",
  },
  {
    heading: "Automate Documentation",
    copy: "Generate MOU drafts, listing packets, and compliance paperwork on demand with reusable prompts.",
  },
  {
    heading: "Stay Market-Ready",
    copy: "Run pricing, transfer-fee, and tax calculators that stay current with Cyprus regulations.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_55%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-20 px-6 py-20 lg:px-12">
          {/* Hero */}
          <header className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                Qualia AI Agents Suite™
              </span>
              <div>
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                  Run every AI-powered client interaction from one command center.
                </h1>
                <p className="mt-5 text-lg text-slate-300">
                  Qualia consolidates messaging, documentation, analytics, and compliance tooling so Cyprus real estate teams can deliver concierge-level service in minutes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] hover:shadow-indigo-500/50"
                >
                  Access Admin Dashboard
                </Link>
                <span className="text-sm text-slate-400">
                  Secure access · Unified analytics · Live agent telemetry
                </span>
              </div>
            </div>
            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-indigo-700/20 backdrop-blur">
              <div className="mb-6 flex items-center justify-between text-xs uppercase text-indigo-200/90">
                <span className="tracking-[0.3em]">Agent Snapshot</span>
                <span>Live sync</span>
              </div>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-slate-200">Active Agents</p>
                  <p className="mt-1 text-3xl font-semibold text-white">37</p>
                  <p className="mt-2 text-xs text-emerald-300">
                    +12% week over week
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/80">
                      Conversations today
                    </p>
                    <p className="mt-1 text-2xl font-semibold">486</p>
                    <p className="mt-3 text-xs text-slate-300">74% resolved without human escalation.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/80">
                      Documents auto-issued
                    </p>
                    <p className="mt-1 text-2xl font-semibold">129</p>
                    <p className="mt-3 text-xs text-slate-300">Contracts, valuations, and MOU packets in minutes.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-indigo-500/10 p-4 text-sm text-indigo-100">
                  <div>
                    <p className="font-semibold">Realtime Signal</p>
                    <p className="text-xs text-indigo-200/80">New WhatsApp lead routed to the Larnaca team.</p>
                  </div>
                  <span className="rounded-full bg-indigo-500/80 px-3 py-1 text-xs font-semibold uppercase">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Feature highlights */}
          <section className="grid gap-6 md:grid-cols-3">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20"
              >
                <div
                  className={`absolute -top-24 right-0 h-48 w-48 rounded-full bg-gradient-to-br ${feature.accent} opacity-40 blur-3xl`}
                  aria-hidden="true"
                />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                  {feature.icon}
                </div>
                <h3 className="relative mt-6 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="relative mt-3 text-sm text-slate-200/80">
                  {feature.description}
                </p>
              </div>
            ))}
          </section>

          {/* Workflow pillars */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-3">
                <span className="inline-block rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                  Built for property teams
                </span>
                <h2 className="text-3xl font-semibold text-white">
                  Every channel, every workflow, in sync.
                </h2>
                <p className="text-base text-slate-200">
                  Launch agents, calculators, and document pipelines that stay compliant with Cyprus regulation while surfacing the metrics your leadership cares about.
                </p>
              </div>
              <div className="grid gap-6">
                {workflowPillars.map((pillar) => (
                  <div
                    key={pillar.heading}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
                  >
                    <h3 className="text-lg font-semibold text-white">{pillar.heading}</h3>
                    <p className="mt-2 text-sm text-slate-300">{pillar.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pb-8 text-center text-xs text-slate-500">
            <div className="flex flex-col items-center gap-4">
              <Image
                src="https://images.squarespace-cdn.com/content/v1/65bf52f873aac538961445c5/19d16cc5-aa83-437c-9c2a-61de5268d5bf/Untitled+design+-+2025-01-19T070746.544.png"
                alt="Qualia Solutions"
                width={180}
                height={60}
                className="opacity-80"
              />
              <p>© 2025 Qualia Solutions. Powered by Next.js, Supabase, and OpenAI.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
