import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function Home() {
  return (
    <PageShell>
      <main className="pb-20 flex-1">
        <section className="max-w-4xl mx-auto text-center px-6 mb-24">
          <div className="inline-flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full mb-8 border border-outline-variant/10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-mono text-on-surface-variant">
              Live Data Stream Active
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-on-surface to-on-surface-variant/50">
            UserLooker
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            High-fidelity analytics for Discord and Roblox ecosystems. Precision
            surveillance tools for guild administrators and data architects.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="precision-gradient text-on-primary-container font-bold px-8 py-4 rounded-xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                search
              </span>
              Start search
            </Link>
            <a
              href="/userlooker/api/auth/discord"
              className="bg-[#5865F2] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95 hover:bg-[#4752C4]"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_circle
              </span>
              Login with Discord
            </a>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="noir-card p-8 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                  Data.Protocol_01
                </span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  database
                </span>
              </div>
              <h3 className="text-on-surface-variant text-sm font-medium mb-2">
                Messages Count
              </h3>
              <div className="font-mono text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
                2,842,910
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="w-[78%] h-full bg-primary" />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant">
                78%
              </span>
            </div>
          </div>

          <div className="noir-card p-8 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                  Data.Protocol_02
                </span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  group
                </span>
              </div>
              <h3 className="text-on-surface-variant text-sm font-medium mb-2">
                Total Tracked Users
              </h3>
              <div className="font-mono text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
                842,102
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="w-[45%] h-full bg-primary" />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant">
                45%
              </span>
            </div>
          </div>

          <div className="noir-card p-8 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
                  Data.Protocol_03
                </span>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                  hub
                </span>
              </div>
              <h3 className="text-on-surface-variant text-sm font-medium mb-2">
                Total Tracked Guilds
              </h3>
              <div className="font-mono text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
                14,029
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="w-[92%] h-full bg-primary" />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant">
                92%
              </span>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
