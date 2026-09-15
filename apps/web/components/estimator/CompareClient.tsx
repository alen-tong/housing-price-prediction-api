"use client";

import { useEffect, useMemo, useState } from "react";
import { getEstimateHistory } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { EstimateRecord } from "@/lib/types";
import { Card } from "@/components/ui/Card";

const featureLabels = [
  ["square_footage", "Square footage"],
  ["bedrooms", "Bedrooms"],
  ["bathrooms", "Bathrooms"],
  ["year_built", "Year built"],
  ["lot_size", "Lot size"],
  ["distance_to_city_center", "Distance to city center"],
  ["school_rating", "School rating"],
] as const;

export function CompareClient({ initialHistory }: { initialHistory: EstimateRecord[] }) {
  const [history, setHistory] = useState(initialHistory);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem("compareEstimateIds");
    setSelectedIds(raw ? JSON.parse(raw) : []);
    if (!initialHistory.length) {
      getEstimateHistory().then((response) => setHistory(response.items)).catch(() => undefined);
    }
  }, [initialHistory.length]);

  const selected = useMemo(
    () => history.filter((item) => selectedIds.includes(item.id)).slice(0, 4),
    [history, selectedIds],
  );

  return (
    <Card title="Property Comparison" description="Compare selected estimate records side-by-side.">
      {selected.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                <th className="w-48 px-3 py-3 text-left text-slate-500">Metric</th>
                {selected.map((item) => (
                  <th key={item.id} className="px-3 py-3 text-left text-slate-950">
                    {item.label || `Estimate #${item.id}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <th className="px-3 py-3 text-left text-slate-500">Predicted price</th>
                {selected.map((item) => (
                  <td key={item.id} className="px-3 py-3 font-semibold text-blue-700">
                    {formatCurrency(item.predicted_price)}
                  </td>
                ))}
              </tr>
              {featureLabels.map(([key, label]) => (
                <tr key={key} className="border-t border-slate-100">
                  <th className="px-3 py-3 text-left text-slate-500">{label}</th>
                  {selected.map((item) => (
                    <td key={item.id} className="px-3 py-3">
                      {formatNumber(item.features[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Select estimates from the estimator history table, then return here to compare them.
        </p>
      )}
    </Card>
  );
}
