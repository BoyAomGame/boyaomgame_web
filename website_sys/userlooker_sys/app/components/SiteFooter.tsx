import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-surface w-full py-12 border-t border-surface-container-low mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 w-full max-w-7xl mx-auto font-mono text-[10px] uppercase tracking-widest gap-6">
        <div className="text-on-surface font-bold">UserLooker</div>
        <div className="flex flex-wrap justify-center gap-8">
          <Link
            href="#"
            className="text-zinc-500 hover:text-on-surface transition-opacity opacity-80 hover:opacity-100"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="text-zinc-500 hover:text-on-surface transition-opacity opacity-80 hover:opacity-100"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-zinc-500 hover:text-on-surface transition-opacity opacity-80 hover:opacity-100"
          >
            API Status
          </Link>
        </div>
        <div className="text-zinc-500">
          © {new Date().getFullYear()} UserLooker. Precision Noir Analytics.
        </div>
      </div>
    </footer>
  );
}
