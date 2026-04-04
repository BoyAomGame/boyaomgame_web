export type SearchMode = "discord" | "roblox";

export const SEARCH_MODE_STORAGE_KEY = "userlooker_search_mode";

export function validateDiscordId(value: string): string | null {
  const t = value.trim();
  if (!/^\d{17,19}$/.test(t)) {
    return "Discord ID must be numeric, 17–19 digits.";
  }
  return null;
}

export function validateRobloxUsername(value: string): string | null {
  const t = value.trim();
  if (t.length < 3 || t.length > 20) {
    return "Roblox username must be 3–20 characters.";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(t)) {
    return "Use letters, numbers, and underscores only.";
  }
  return null;
}

export function validateQuery(mode: SearchMode, value: string): string | null {
  return mode === "discord"
    ? validateDiscordId(value)
    : validateRobloxUsername(value);
}
