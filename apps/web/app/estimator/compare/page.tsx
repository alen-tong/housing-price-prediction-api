import { CompareClient } from "@/components/estimator/CompareClient";
import { getEstimateHistory } from "@/lib/api";

export default async function ComparePage() {
  const history = await getEstimateHistory(true)
    .then((response) => response.items)
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          Estimator
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Compare Properties
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Analyze multiple property estimates side-by-side using saved estimate history.
        </p>
      </div>
      <CompareClient initialHistory={history} />
    </div>
  );
}
