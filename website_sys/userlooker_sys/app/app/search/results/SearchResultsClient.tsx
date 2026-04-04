"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { SearchMode } from "@/lib/searchValidation";
import { validateQuery } from "@/lib/searchValidation";

type UserPayload = {
  discord: {
    id: string;
    username: string;
    avatar_url: string | null;
    banner_color: string | null;
  };
  roblox: {
    primary_name: string | null;
    history: string[];
  };
  stats: {
    total_messages: number;
    first_seen?: string | null;
    last_seen?: string | null;
    guild_count: number;
    heatmap: Record<string, Record<string, number>>;
  };
  associated_discord_ids?: string[];
};

type ApiResponse = {
  success: boolean;
  data?: UserPayload;
  error?: string;
};

function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SearchResultsClient() {
  const searchParams = useSearchParams();
  const modeRaw = searchParams.get("mode");
  const qRaw = searchParams.get("q");

  const mode: SearchMode | null =
    modeRaw === "discord" || modeRaw === "roblox" ? modeRaw : null;
  const queryDecoded = qRaw ? decodeURIComponent(qRaw) : "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserPayload | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const runFetch = useCallback(async () => {
    if (!mode || !queryDecoded) {
      setData(null);
      setError(null);
      setRateLimited(false);
      return;
    }

    const validationError = validateQuery(mode, queryDecoded);
    if (validationError) {
      setError(validationError);
      setData(null);
      setRateLimited(false);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setRateLimited(false);

    const path =
      mode === "discord"
        ? `/user/${encodeURIComponent(queryDecoded.trim())}`
        : `/roblox_search/${encodeURIComponent(queryDecoded.trim())}`;

    try {
      const res = await fetch(path, { cache: "no-store" });
      setRateLimited(res.headers.get("X-Rate-Limited") === "true");
      const json = (await res.json()) as ApiResponse;

      if (!res.ok || !json.success) {
        setError(json.error || `Request failed (${res.status})`);
        return;
      }
      if (json.data) {
        setData(json.data);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [mode, queryDecoded]);

  useEffect(() => {
    runFetch();
  }, [runFetch]);

  if (!qRaw) {
    return (
      <div className="max-w-2xl mx-auto px-6 w-full flex-1 pb-16">
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-8 text-center">
          <p className="text-on-surface-variant mb-4">
            No search query. Start from the search page or dashboard.
          </p>
          <Link
            href="/search"
            className="inline-flex precision-gradient text-on-primary-container font-bold px-6 py-2 rounded-lg text-sm"
          >
            Go to search
          </Link>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="max-w-2xl mx-auto px-6 w-full flex-1 pb-16">
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-8 text-center">
          <p className="text-on-surface-variant mb-4">
            Invalid search mode. Use{" "}
            <span className="font-mono text-on-surface">discord</span> or{" "}
            <span className="font-mono text-on-surface">roblox</span>.
          </p>
          <Link
            href="/search"
            className="inline-flex precision-gradient text-on-primary-container font-bold px-6 py-2 rounded-lg text-sm"
          >
            Go to search
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 w-full flex-1 pb-16">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface-container-low rounded-lg w-1/3" />
          <div className="h-48 bg-surface-container-low rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 w-full flex-1 pb-16">
        <div className="bg-surface-container-low border border-error/30 rounded-lg p-8">
          <p className="text-error font-medium mb-2">Could not load profile</p>
          <p className="text-on-surface-variant text-sm mb-6">{error}</p>
          <Link
            href="/search"
            className="text-primary text-sm font-semibold hover:underline"
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const ids = data.associated_discord_ids ?? [];
  const showMulti = ids.length > 1;

  return (
    <div className="max-w-2xl mx-auto px-6 w-full flex-1 pb-16 space-y-6">
      {rateLimited ? (
        <p className="text-xs text-tertiary border border-outline-variant/20 bg-surface-container-low px-3 py-2 rounded-lg">
          Discord live data was rate-limited; showing cached archive fields where
          available.
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-black tracking-tight text-on-surface">
          Result
        </h1>
        <Link
          href="/search"
          className="text-xs text-on-surface-variant hover:text-primary uppercase tracking-widest"
        >
          New search
        </Link>
      </div>

      <article className="bg-surface-container-low border border-outline-variant/10 rounded-lg overflow-hidden">
        <div
          className="h-2 w-full"
          style={{
            backgroundColor:
              data.discord.banner_color && /^#[0-9a-fA-F]{6}$/.test(data.discord.banner_color)
                ? data.discord.banner_color
                : "var(--color-primary-container)",
          }}
          aria-hidden
        />
        <div className="p-8 flex flex-col sm:flex-row gap-6">
          <div className="shrink-0">
            {data.discord.avatar_url ? (
              <Image
                src={data.discord.avatar_url}
                alt={`${data.discord.username} avatar`}
                width={96}
                height={96}
                className="rounded-full border border-outline-variant/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-outline">
                  person
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Discord
              </p>
              <p className="text-2xl font-semibold text-on-surface truncate">
                {data.discord.username}
              </p>
              <p className="font-mono text-sm text-on-surface-variant">
                {data.discord.id}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Roblox
              </p>
              <p className="text-lg font-medium text-on-surface">
                {data.roblox.primary_name ?? "—"}
              </p>
              {data.roblox.history?.length ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.roblox.history.map((name) => (
                    <span
                      key={name}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-outline-variant/10 border-t border-outline-variant/10">
          {[
            { label: "Messages", value: data.stats.total_messages.toLocaleString() },
            { label: "Guilds", value: String(data.stats.guild_count) },
            { label: "First seen", value: formatWhen(data.stats.first_seen) },
            { label: "Last seen", value: formatWhen(data.stats.last_seen) },
          ].map((cell) => (
            <div
              key={cell.label}
              className="bg-surface-container-low p-4 sm:p-5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1">
                {cell.label}
              </p>
              <p className="font-mono text-sm text-on-surface leading-snug">
                {cell.value}
              </p>
            </div>
          ))}
        </div>
      </article>

      {showMulti ? (
        <section className="bg-surface-container-low border border-outline-variant/10 rounded-lg p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
            Linked Discord accounts
          </h2>
          <p className="text-xs text-on-surface-variant mb-4">
            This Roblox user maps to multiple Discord snowflakes in the archive.
          </p>
          <ul className="flex flex-wrap gap-2">
            {ids.map((id) => (
              <li key={id}>
                <Link
                  href={`/search/results?mode=discord&q=${encodeURIComponent(id)}`}
                  className="inline-block font-mono text-xs px-3 py-1.5 rounded-lg border border-outline-variant/30 text-primary hover:bg-surface-container-high transition-colors"
                >
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
