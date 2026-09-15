"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEstimator } from "@/hooks/useEstimator";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { EstimateRecord } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";

const fields = [
  ["square_footage", "Square footage"],
  ["bedrooms", "Bedrooms"],
  ["bathrooms", "Bathrooms"],
  ["year_built", "Year built"],
  ["lot_size", "Lot size"],
  ["distance_to_city_center", "Distance to city center"],
  ["school_rating", "School rating"],
] as const;

const defaultValues = {
  label: "Demo property",
  square_footage: 1550,
  bedrooms: 3,
  bathrooms: 2,
  year_built: 1997,
  lot_size: 6800,
  distance_to_city_center: 4.1,
  school_rating: 7.6,
};

export function EstimatorClient({ initialHistory }: { initialHistory: EstimateRecord[] }) {
  const { history, latest, errors, isLoading, apiError, submit } = useEstimator(initialHistory);

  function onSubmit(formData: FormData) {
    submit(Object.fromEntries(formData.entries()));
  }

  const chartData = history.slice(0, 6).reverse().map((item) => ({
    name: item.label || `#${item.id}`,
    price: item.predicted_price,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <Card title="Estimate a Property" description="Enter all model features and submit them to the Python backend.">
        <form action={onSubmit} className="space-y-4">
          <Field name="label" label="Label" defaultValue={defaultValues.label} />
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([name, label]) => (
              <Field
                key={name}
                name={name}
                label={label}
                type="number"
                step={name === "bedrooms" || name === "year_built" ? "1" : "0.1"}
                defaultValue={defaultValues[name]}
                error={errors[name]}
                required
              />
            ))}
          </div>
          {apiError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Estimating..." : "Create estimate"}
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card title="Latest Prediction" description="Prediction returned by the ML model through the estimator backend.">
          {latest ? (
            <div className="space-y-4">
              <p className="text-4xl font-bold text-blue-700">{formatCurrency(latest.predicted_price)}</p>
              <FeatureTable record={latest} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Submit a property to see the latest prediction.</p>
          )}
        </Card>

        <Card title="Recent Estimate Chart" description="Visual comparison of recent predicted prices.">
          {chartData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="price" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Estimate history will appear here.</p>
          )}
        </Card>
      </div>

      <Card
        title="Estimate History"
        description="Previous estimates are stored by the Python backend in SQLite."
        className="lg:col-span-2"
      >
        <div className="mb-4 flex justify-end">
          <Link
            href="/estimator/compare"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Compare selected
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Compare</th>
                <th className="px-3 py-3">Label</th>
                <th className="px-3 py-3">Price</th>
                <th className="px-3 py-3">Square feet</th>
                <th className="px-3 py-3">Bedrooms</th>
                <th className="px-3 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select estimate ${item.id} for comparison`}
                      onChange={(event) => updateCompareSelection(item.id, event.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900">{item.label || `#${item.id}`}</td>
                  <td className="px-3 py-3">{formatCurrency(item.predicted_price)}</td>
                  <td className="px-3 py-3">{formatNumber(item.features.square_footage)}</td>
                  <td className="px-3 py-3">{item.features.bedrooms}</td>
                  <td className="px-3 py-3">{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!history.length && <p className="py-8 text-center text-sm text-slate-500">No estimates yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function FeatureTable({ record }: { record: EstimateRecord }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {fields.map(([name, label]) => (
          <tr key={name} className="border-t border-slate-100">
            <th className="py-2 text-left font-medium text-slate-500">{label}</th>
            <td className="py-2 text-right text-slate-900">
              {formatNumber(record.features[name])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function updateCompareSelection(id: number, checked: boolean) {
  const raw = window.localStorage.getItem("compareEstimateIds");
  const selected = new Set<number>(raw ? JSON.parse(raw) : []);
  if (checked) {
    selected.add(id);
  } else {
    selected.delete(id);
  }
  window.localStorage.setItem("compareEstimateIds", JSON.stringify([...selected].slice(-4)));
}
