import { loadMatches, type MatchRow } from "@/lib/matches";

function formatStartTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Home() {
  const result = await loadMatches();
  const matches: MatchRow[] = result.ok ? result.matches : [];
  const error = result.ok ? null : result.error;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Matches</h2>
        <p className="text-sm text-foreground/70">
          ATP &amp; WTA matches with decimal moneyline odds.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          {error}
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm text-foreground/70">
          No matches found right now.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] dark:bg-white/[.06]">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Tournament</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">Player 1</th>
                <th className="px-3 py-2 font-medium">P1 odds</th>
                <th className="px-3 py-2 font-medium">Player 2</th>
                <th className="px-3 py-2 font-medium">P2 odds</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr
                  key={match.id}
                  className="border-t border-black/10 dark:border-white/10"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {match.tournament ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatStartTime(match.startTime)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{match.player1}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                    {match.player1Odds ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{match.player2}</td>
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                    {match.player2Odds ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
