import { MarketDashboard } from "@/components/market/MarketDashboard";
import { getMarketSummary } from "@/lib/api";

export default async function MarketPage() {
  const summary = await getMarketSummary(true).catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          Java Backend
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Property Market Analysis
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Explore market aggregates, segment filters, property tables, exports, and what-if
          predictions powered by the Java Spring Boot backend.
        </p>
      </div>
      <MarketDashboard initialSummary={summary} />
    </div>
  );
}
