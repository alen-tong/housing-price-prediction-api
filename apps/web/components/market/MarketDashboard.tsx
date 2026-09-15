"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { marketExportUrl } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { HousingFeatures, MarketSummary } from "@/lib/types";
import { useMarket } from "@/hooks/useMarket";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";

const featureDefaults: HousingFeatures = {
  square_footage: 1870,
  bedrooms: 3,
  bathrooms: 2.5,
  year_built: 2001,
  lot_size: 7900,
  distance_to_city_center: 5.5,
  school_rating: 8.3,
};

export function MarketDashboard({ initialSummary }: { initialSummary: MarketSummary | null }) {
  const market = useMarket();

  function submitWhatIf(formData: FormData) {
    market.submitWhatIf({
      square_footage: Number(formData.get("square_footage")),
      bedrooms: Number(formData.get("bedrooms")),
      bathrooms: Number(formData.get("bathrooms")),
      year_built: Number(formData.get("year_built")),
      lot_size: Number(formData.get("lot_size")),
      distance_to_city_center: Number(formData.get("distance_to_city_center")),
      school_rating: Number(formData.get("school_rating")),
    });
  }

  return (
    <div className="space-y-6">
      {market.apiError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {market.apiError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Properties" value={initialSummary ? formatNumber(initialSummary.count) : "-"} />
        <Stat label="Average price" value={initialSummary ? formatCurrency(initialSummary.averagePrice) : "-"} />
        <Stat label="Minimum price" value={initialSummary ? formatCurrency(initialSummary.minPrice) : "-"} />
        <Stat label="Maximum price" value={initialSummary ? formatCurrency(initialSummary.maxPrice) : "-"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card title="Segment Analysis" description="Aggregate market price by segment. Results are cached by the Java backend.">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Group by</span>
              <select
                value={market.groupBy}
                onChange={(event) => market.setGroupBy(event.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="bedrooms">Bedrooms</option>
                <option value="school_rating">School rating band</option>
                <option value="year_built">Year built band</option>
                <option value="bathrooms">Bathrooms</option>
              </select>
            </label>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={market.segments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="averagePrice" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="What-if Analysis" description="Send a hypothetical property through the Java backend to the ML model.">
          <form action={submitWhatIf} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(featureDefaults).map(([key, value]) => (
                <Field
                  key={key}
                  name={key}
                  label={labelFor(key)}
                  type="number"
                  step={key === "bedrooms" || key === "year_built" ? "1" : "0.1"}
                  defaultValue={value}
                  required
                />
              ))}
            </div>
            <Button type="submit" disabled={market.isLoading}>
              Run what-if
            </Button>
          </form>
          {market.whatIfResult && (
            <div className="mt-5 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">Predicted price</p>
              <p className="mt-1 text-3xl font-bold text-blue-950">
                {formatCurrency(market.whatIfResult.predictedPrice)}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Model version: {market.whatIfResult.modelVersion}
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card title="Market Data Table" description="Responsive table with backend filtering and sorting.">
        <div className="no-print mb-4 grid gap-3 md:grid-cols-6">
          <Field label="Bedrooms" type="number" value={market.bedrooms} onChange={(e) => market.setBedrooms(e.target.value)} />
          <Field label="Min price" type="number" value={market.minPrice} onChange={(e) => market.setMinPrice(e.target.value)} />
          <Field label="Max price" type="number" value={market.maxPrice} onChange={(e) => market.setMaxPrice(e.target.value)} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Sort</span>
            <select
              value={market.sort}
              onChange={(event) => market.setSort(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="price">Price</option>
              <option value="square_footage">Square footage</option>
              <option value="school_rating">School rating</option>
              <option value="year_built">Year built</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Direction</span>
            <select
              value={market.direction}
              onChange={(event) => market.setDirection(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <a
              href={marketExportUrl(market.queryParams)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </a>
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Export PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Sq ft</th>
                <th className="px-3 py-3">Beds</th>
                <th className="px-3 py-3">Baths</th>
                <th className="px-3 py-3">Year</th>
                <th className="px-3 py-3">Lot</th>
                <th className="px-3 py-3">Distance</th>
                <th className="px-3 py-3">School</th>
              </tr>
            </thead>
            <tbody>
              {market.properties?.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">{item.id}</td>
                  <td className="px-3 py-3 font-semibold">{formatCurrency(item.price)}</td>
                  <td className="px-3 py-3">{formatNumber(item.squareFootage)}</td>
                  <td className="px-3 py-3">{item.bedrooms}</td>
                  <td className="px-3 py-3">{item.bathrooms}</td>
                  <td className="px-3 py-3">{item.yearBuilt}</td>
                  <td className="px-3 py-3">{formatNumber(item.lotSize)}</td>
                  <td className="px-3 py-3">{formatNumber(item.distanceToCityCenter)}</td>
                  <td className="px-3 py-3">{formatNumber(item.schoolRating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!market.properties?.items.length && (
            <p className="py-8 text-center text-sm text-slate-500">No properties match the current filters.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </Card>
  );
}

function labelFor(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
