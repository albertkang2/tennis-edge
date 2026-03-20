/**
 * Shared Odds-API.io tennis matches fetch (used by /api/matches and the home page).
 * Calling this directly from the server avoids an extra HTTP hop and flaky dev chunks.
 */

export type MatchRow = {
  id: string;
  tournament: string | null;
  startTime: string | null;
  player1: string;
  player2: string;
  player1Odds: number | null;
  player2Odds: number | null;
};

type EventDto = {
  id: number;
  home: string;
  away: string;
  date: string;
  league?: { name?: string; slug?: string };
};

type OddsMarket = { name?: string; odds?: Array<Record<string, unknown>> };

type OddsEventDto = { id: number; bookmakers?: Record<string, OddsMarket[]> };

async function fetchJson<T>(url: URL): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Odds API request failed (${res.status}): ${text}`);
  }
  return JSON.parse(text) as T;
}

function isAtpOrWta(event: EventDto): boolean {
  const leagueName = (event.league?.name ?? "").toLowerCase();
  const leagueSlug = (event.league?.slug ?? "").toLowerCase();
  return (
    leagueName.includes("atp") ||
    leagueName.includes("wta") ||
    leagueSlug.includes("atp") ||
    leagueSlug.includes("wta")
  );
}

function getBestMoneyline(bookmakers: OddsEventDto["bookmakers"]) {
  if (!bookmakers) return { player1Odds: null, player2Odds: null };

  let bestP1: number | null = null;
  let bestP2: number | null = null;

  for (const markets of Object.values(bookmakers)) {
    const market = markets.find((m) => m?.name === "ML");
    const odds = market?.odds?.[0];
    if (!odds || typeof odds !== "object") continue;

    const homeRaw = (odds as Record<string, unknown>).home;
    const awayRaw = (odds as Record<string, unknown>).away;

    const home =
      typeof homeRaw === "string" ? Number.parseFloat(homeRaw) : Number.NaN;
    const away =
      typeof awayRaw === "string" ? Number.parseFloat(awayRaw) : Number.NaN;

    if (Number.isFinite(home)) bestP1 = bestP1 ? Math.max(bestP1, home) : home;
    if (Number.isFinite(away)) bestP2 = bestP2 ? Math.max(bestP2, away) : away;
  }

  return { player1Odds: bestP1, player2Odds: bestP2 };
}

const ALLOWED_BOOKMAKERS = [
  "BetMGM",
  "DraftKings",
  "FanDuel",
  "GG.bet",
  "Caesars",
  "Betfair Exchange",
  "10BET",
  "Unibet",
  "Stake",
  "Bet365",
];

export type LoadMatchesResult =
  | { ok: true; matches: MatchRow[] }
  | { ok: false; error: string; status: number };

export async function loadMatches(): Promise<LoadMatchesResult> {
  const apiKey = process.env.ODDS_API_KEY;
  const baseUrl = process.env.ODDS_API_BASE_URL ?? "https://api.odds-api.io/v3";
  const apiBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  if (!apiKey) {
    return { ok: false, error: "Missing ODDS_API_KEY", status: 500 };
  }

  try {
    const eventsUrl = new URL("events", apiBase);
    eventsUrl.searchParams.set("apiKey", apiKey);
    eventsUrl.searchParams.set("sport", "tennis");
    eventsUrl.searchParams.set("status", "pending,live");
    eventsUrl.searchParams.set("limit", "50");

    const events = await fetchJson<EventDto[]>(eventsUrl);
    const atpWta = events.filter(isAtpOrWta);
    const selected = (atpWta.length > 0 ? atpWta : events).slice(0, 10);

    if (selected.length === 0) {
      return { ok: true, matches: [] };
    }

    const oddsUrl = new URL("odds/multi", apiBase);
    oddsUrl.searchParams.set("apiKey", apiKey);
    oddsUrl.searchParams.set(
      "eventIds",
      selected.map((e) => String(e.id)).join(",")
    );
    oddsUrl.searchParams.set("bookmakers", ALLOWED_BOOKMAKERS.join(","));

    const oddsEvents = await fetchJson<OddsEventDto[]>(oddsUrl);
    const oddsById = new Map<number, OddsEventDto>();
    for (const event of oddsEvents) oddsById.set(event.id, event);

    const matches: MatchRow[] = selected.map((event) => {
      const best = getBestMoneyline(oddsById.get(event.id)?.bookmakers);
      return {
        id: String(event.id),
        tournament: event.league?.name ?? null,
        startTime: event.date ?? null,
        player1: event.home,
        player2: event.away,
        player1Odds: best.player1Odds,
        player2Odds: best.player2Odds,
      };
    });

    return { ok: true, matches };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch matches";
    return { ok: false, error: message, status: 502 };
  }
}
