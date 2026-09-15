import { EstimatorClient } from "@/components/estimator/EstimatorClient";
import { getEstimateHistory } from "@/lib/api";

export default async function EstimatorPage() {
  const history = await getEstimateHistory(true)
    .then((response) => response.items)
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          Python Backend
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Property Value Estimator
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Submit property features to the Python estimator API, which validates the request,
          calls the Task 1 ML model, and stores prediction history in SQLite.
        </p>
      </div>
      <EstimatorClient initialHistory={history} />
    </div>
  );
}
