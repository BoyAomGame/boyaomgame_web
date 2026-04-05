"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  SEARCH_MODE_STORAGE_KEY,
  type SearchMode,
  validateQuery,
} from "@/lib/searchValidation";

export function SearchPageClient() {
  const router = useRouter();
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

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_MODE_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateQuery(mode, query);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const q = encodeURIComponent(query.trim());
    router.push(`/search/results?mode=${mode}&q=${q}`);
  }

  return (
    <div className="max-w-xl mx-auto px-6 w-full flex-1 pb-16">
      <h1 className="text-2xl font-black tracking-tight text-on-surface mb-2">
        Search
      </h1>
      <p className="text-sm text-on-surface-variant mb-8">
        Look up a profile by Discord snowflake or Roblox username. Your last
        search mode is remembered on this device.
      </p>

      <form
        onSubmit={onSubmit}
        className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-6 space-y-6"
      >
        <div>
          <label
            htmlFor="search-mode"
            className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-2"
          >
            Search type
          </label>
          <div className="flex rounded-lg border border-outline-variant/20 overflow-hidden">
            <button
              type="button"
              id="search-mode-roblox"
              onClick={() => {
                setMode("roblox");
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === "roblox"
                  ? "bg-primary-container/30 text-primary"
                  : "bg-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Roblox username
            </button>
            <button
              type="button"
              id="search-mode-discord"
              onClick={() => {
                setMode("discord");
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-outline-variant/20 ${
                mode === "discord"
                  ? "bg-primary-container/30 text-primary"
                  : "bg-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Discord ID
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="search-query"
            className="block text-[11px] font-bold uppercase tracking-wider text-outline mb-2"
          >
            {mode === "discord" ? "Discord user ID" : "Roblox username"}
          </label>
          <input
            id="search-query"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            placeholder={
              mode === "discord"
                ? "e.g. 123456789012345678"
                : "e.g. RobloxUserName"
            }
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full precision-gradient text-on-primary-container font-bold py-3 rounded-lg text-sm active:scale-[0.99] transition-transform"
        >
          Search archive
        </button>
      </form>
    </div>
  );
}
