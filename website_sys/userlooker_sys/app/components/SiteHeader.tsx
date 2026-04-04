"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const navClass =
  "text-zinc-400 hover:text-on-surface transition-colors hover:bg-surface-container-low/50 px-2 py-1 rounded-sm text-sm";

export function SiteHeader() {
  const { data: session } = useSession();

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
        {session?.user ? (
          <div className="flex items-center gap-3">
            {session.user.isAdmin && (
              <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                Admin
              </span>
            )}
            <div className="flex items-center gap-2">
              {session.user.avatar_url ? (
                <Image
                  src={session.user.avatar_url}
                  alt={session.user.username ?? "User"}
                  width={28}
                  height={28}
                  className="rounded-full border border-outline-variant/30"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-outline">
                    person
                  </span>
                </div>
              )}
              <span className="text-sm text-on-surface font-medium hidden sm:inline">
                {session.user.username}
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-xs text-on-surface-variant hover:text-error transition-colors ml-1"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
            </button>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
