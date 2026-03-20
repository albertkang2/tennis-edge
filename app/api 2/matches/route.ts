import { NextResponse } from "next/server";

type SimpleEventDto = {
  id: number;
  home: string;
  away: string;
  date: string;
  league?: { name?: string; slug?: string };
  status?: string;
};

type OddsMarket = {
  name?: string;
  odds?: Array<Record<string, unknown>>;
};

type OddsEventDto = {
  id: number;
  home?: string;
  away?: string;
  date?: string;
  league?: { name?: string; slug?: string };
  bookmakers?: Record<string, OddsMarket[]>;
};

type MatchResponse = {
  id: string;
  tournament: string | null;
  startTime: string | null;
  player1: string;
  player2: string;
  player1Odds: number | null;
  player2Odds: number | null;
};

function extractBestMoneyline(bookmakers: OddsEventDto["bookmakers"]): {
  home: number | null;
  away: number | null;
} {
  let bestHome: number | null = null;
  let bestAway: number | null = null;

  if (!bookmakers) return { home: null, away: null };

  for (const markets of Object.values(bookmakers)) {
    const ml = markets?.find((m) => m?.name === "ML");
    const first = ml?.odds?.[0];
    if (!first || typeof first !== "object") continue;

    const homeRaw = (first as Record<string, unknown>).home;
    const awayRaw = (first as Record<string, unknown>).away;

    const home = typeof homeRaw === "string" ? Number.parseFloat(homeRaw) : null;
    const away = typeof awayRaw === "string" ? Number.parseFloat(awayRaw) : null;

    if (home && Number.isFinite(home)) bestHome = bestHome ? Math.max(bestHome, home) : home;
    if (away && Number.isFinite(away)) bestAway = bestAway ? Math.max(bestAway, away) : away;
  }

  return { home: bestHome, away: bestAway };
}

async function fetchJson<T>(url: URL, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Odds API request failed (${res.status}): ${text}`);
  }
  return JSON.parse(text) as T;
}

export async function GET() {
  const apiKey = process.env.ODDS_API_KEY;
  const baseUrl = process.env.ODDS_API_BASE_URL ?? "https://api.odds-api.io/v3";
  const apiBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ODDS_API_KEY" },
      { status: 500 }
    );
  }

  const eventsUrl = new URL("events", apiBase);
  eventsUrl.searchParams.set("apiKey", apiKey);
  eventsUrl.searchParams.set("sport", "tennis");
  eventsUrl.searchParams.set("status", "pending,live");
  eventsUrl.searchParams.set("limit", "30");

  let events: SimpleEventDto[];
  try {
    events = await fetchJson<SimpleEventDto[]>(eventsUrl, { cache: "no-store" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch events" },
      { status: 502 }
    );
  }

  // Show all tennis (upcoming + live). API allows max 10 eventIds for /odds/multi.
  const filtered = events.slice(0, 10);
  if (filtered.length === 0) {
    return NextResponse.json([] satisfies MatchResponse[], { status: 200 });
  }

  // Use only bookmakers allowed by your plan (403 lists them; max 10).
  const allowedBookmakers =
    "Bet365,Unibet,BetMGM,DraftKings,FanDuel,GG.bet,Caesars,Stake,10BET,Betfair Exchange";

  const oddsUrl = new URL("odds/multi", apiBase);
  oddsUrl.searchParams.set("apiKey", apiKey);
  oddsUrl.searchParams.set(
    "eventIds",
    filtered.map((e) => String(e.id)).join(",")
  );
  oddsUrl.searchParams.set("bookmakers", allowedBookmakers);

  let oddsEvents: OddsEventDto[];
  try {
    oddsEvents = await fetchJson<OddsEventDto[]>(oddsUrl, { cache: "no-store" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch odds" },
      { status: 502 }
    );
  }

  const oddsById = new Map<number, OddsEventDto>();
  for (const o of oddsEvents) oddsById.set(o.id, o);

  const matches: MatchResponse[] = filtered.map((e) => {
    const o = oddsById.get(e.id);
    const best = extractBestMoneyline(o?.bookmakers);
    return {
      id: String(e.id),
      tournament: e.league?.name ?? null,
      startTime: e.date ?? null,
      player1: e.home,
      player2: e.away,
      player1Odds: best.home,
      player2Odds: best.away,
    };
  });

  return NextResponse.json(matches, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

