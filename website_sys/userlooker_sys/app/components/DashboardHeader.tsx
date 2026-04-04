"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  SEARCH_MODE_STORAGE_KEY,
  type SearchMode,
  validateQuery,
} from "@/lib/searchValidation";

export function DashboardHeader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<SearchMode>("roblox");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_MODE_STORAGE_KEY);
      if (stored === "discord" || stored === "roblox") {
        setMode(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const goToResults = useCallback(() => {
    const err = validateQuery(mode, query);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const q = encodeURIComponent(query.trim());
    router.push(`/search/results?mode=${mode}&q=${q}`);
  }, [mode, query, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    goToResults();
  }

  return (
    <header className="fixed top-0 w-full border-b border-outline-variant/10 bg-surface/70 backdrop-blur-xl flex justify-between items-center h-16 px-6 z-50 tracking-tight">
      <div className="flex items-center gap-4 md:gap-8 min-w-0">
        <Link
          href="/"
          className="text-xl font-black text-on-surface tracking-tighter uppercase shrink-0"
        >
          UserLooker
        </Link>
        <Link
          href="/search"
          className="md:hidden text-xs text-primary font-semibold uppercase tracking-wider shrink-0"
        >
          Search
        </Link>
        <form
          onSubmit={onSubmit}
          className="hidden md:flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 border border-outline-variant/10 focus-within:border-primary/40 transition-all min-w-0 max-w-xl"
        >
          <div className="flex items-center gap-2 pr-3 border-r border-outline-variant/20 mr-3 shrink-0">
            <span className="material-symbols-outlined text-primary text-sm">
              filter_list
            </span>
            <select
              value={mode}
              onChange={(e) => {
                const next = e.target.value as SearchMode;
                setMode(next);
                try {
                  localStorage.setItem(SEARCH_MODE_STORAGE_KEY, next);
                } catch {
                  /* ignore */
                }
              }}
              className="bg-transparent text-xs text-on-surface-variant font-medium focus:ring-0 border-none p-0 cursor-pointer max-w-[140px]"
              aria-label="Search mode"
            >
              <option value="discord">Discord User</option>
              <option value="roblox">Roblox Username</option>
            </select>
          </div>
          <span className="material-symbols-outlined text-outline text-[20px] mr-2 shrink-0">
            search
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            className="bg-transparent border-none focus:ring-0 text-sm flex-1 min-w-0 text-on-surface outline-none"
            placeholder={
              mode === "discord"
                ? "Discord user ID…"
                : "Roblox username…"
            }
            type="search"
            autoComplete="off"
          />
          <div className="ml-4 flex items-center gap-1 bg-surface-variant/50 px-1.5 py-0.5 rounded border border-outline-variant/20 shrink-0">
            <span className="text-[10px] text-outline font-bold">⌘</span>
            <span className="text-[10px] text-outline font-bold">K</span>
          </div>
        </form>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <Link
          href="/search"
          className="hidden sm:inline text-xs text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest"
        >
          Full search
        </Link>
        <span
          className="material-symbols-outlined text-on-surface-variant"
          aria-hidden
        >
          settings
        </span>
        <div
          className="h-8 w-8 rounded-full bg-surface-container-high border border-outline-variant/30"
          aria-hidden
        />
      </div>
      {error ? (
        <p
          className="absolute top-full left-6 mt-1 text-xs text-error max-w-md"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </header>
  );
}
