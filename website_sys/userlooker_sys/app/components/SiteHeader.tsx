import Link from "next/link";

const navClass =
  "text-zinc-400 hover:text-on-surface transition-colors hover:bg-surface-container-low/50 px-2 py-1 rounded-sm text-sm";

export function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-header border-b border-surface-container-low">
      <nav className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto tracking-tight">
        <Link
          href="/"
          className="text-xl font-black text-on-surface tracking-tighter"
        >
          UserLooker
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className={navClass}>
            Dashboard
          </Link>
          <Link href="/search" className={navClass}>
            Search
          </Link>
        </div>
        <button
          type="button"
          disabled
          title="Discord sign-in is not configured yet"
          className="precision-gradient text-on-primary-container font-semibold px-5 py-2 rounded-lg text-sm opacity-90 cursor-not-allowed shadow-lg shadow-primary/10"
        >
          Connect Discord
        </button>
      </nav>
    </header>
  );
}
