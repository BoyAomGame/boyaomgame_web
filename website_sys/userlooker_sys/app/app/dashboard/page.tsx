import { DashboardHeader } from "@/components/DashboardHeader";

const announcements = [
  {
    title: "v1.2 Protocol Deployment: Enhanced Roblox Scrapers",
    date: "Oct 24, 2023",
    body: "We've optimized the scraping engine to reduce latency by 40% when fetching high-volume player data. This update addresses the recent Roblox API rate-limiting issues…",
  },
  {
    title: "New Global Blacklist Integration",
    date: "Oct 20, 2023",
    body: "Users can now cross-reference Discord IDs with the centralized Looker Blacklist, flagging potential bad actors across 400+ tracked servers automatically.",
  },
  {
    title: "Infrastructure Maintenance Window",
    date: "Oct 18, 2023",
    body: "Brief downtime scheduled for Sunday at 04:00 UTC for database sharding. Data ingestion will be queued and processed immediately following maintenance.",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <DashboardHeader />
      <main className="flex-grow pt-24 p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-12 gap-6 auto-rows-[160px]">
          <div className="col-span-12 md:col-span-4 bg-surface-container-low p-6 flex flex-col justify-between group hover:bg-surface-container-high transition-colors duration-200 rounded-sm border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Messages Count
              </span>
              <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                chat_bubble
              </span>
            </div>
            <div>
              <h3 className="font-mono text-3xl font-medium tracking-tighter">
                1,248,592
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-primary mt-1">
                <span className="material-symbols-outlined text-xs">
                  trending_up
                </span>
                <span className="font-mono">+12.4% vs last week</span>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bg-surface-container-low p-6 flex flex-col justify-between group hover:bg-surface-container-high transition-colors duration-200 rounded-sm border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Total Tracked Users
              </span>
              <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                person_search
              </span>
            </div>
            <div>
              <h3 className="font-mono text-3xl font-medium tracking-tighter">
                84,201
              </h3>
              <p className="text-[11px] text-on-surface-variant/60 mt-1 uppercase tracking-tight">
                Active synchronization
              </p>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 bg-surface-container-low p-6 flex flex-col justify-between group hover:bg-surface-container-high transition-colors duration-200 rounded-sm border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Total Tracked Guilds
              </span>
              <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                hub
              </span>
            </div>
            <div>
              <h3 className="font-mono text-3xl font-medium tracking-tighter">
                412
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-error mt-1">
                <span className="material-symbols-outlined text-xs">
                  warning
                </span>
                <span className="font-mono">
                  3 guild connections unstable
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-12 row-span-2 bg-surface-container-low p-8 flex flex-col rounded-sm border border-outline-variant/10 min-h-[320px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                <span className="h-1.5 w-1.5 bg-primary rounded-full" />
                Announcements
              </h2>
              <button
                type="button"
                className="text-xs text-outline hover:text-on-surface transition-colors"
              >
                View Archive
              </button>
            </div>
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {announcements.map((item) => (
                <div key={item.title} className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <span className="font-mono text-[10px] text-outline mt-1 shrink-0">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant/70 leading-relaxed max-w-4xl">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-outline-variant/10 bg-surface py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-black text-on-surface tracking-tighter uppercase">
              UserLooker
            </span>
            <p className="text-[11px] text-outline tracking-tight uppercase">
              © {new Date().getFullYear()} UserLooker Onyx. All protocols
              reserved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <a
              href="#"
              className="text-xs text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest"
            >
              Terms of Service
            </a>
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/20">
              <span className="h-1.5 w-1.5 bg-[#4ade80] rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                API Status: Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
