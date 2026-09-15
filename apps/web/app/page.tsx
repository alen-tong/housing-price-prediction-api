import Link from "next/link";
import { Card } from "@/components/ui/Card";

const services = [
  {
    title: "ML Model API",
    body: "Reusable FastAPI service that exposes housing price predictions and model metadata.",
    href: "http://localhost:8000/docs",
  },
  {
    title: "Property Value Estimator",
    body: "Python-backed transactional app for submitting estimates and reviewing history.",
    href: "/estimator",
  },
  {
    title: "Property Market Analysis",
    body: "Java-backed analytics app for market aggregates, filters, what-if analysis, and exports.",
    href: "/market",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 px-8 py-12 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
          Fullstack Assignment
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          A unified portal around a reusable housing price model service.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
          The portal hosts two independent applications with different backend technologies:
          a Python estimator workflow and a Java market analysis dashboard. Both integrate with
          the Task 1 ML model API.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {services.map((service) => (
          <Card key={service.title} title={service.title}>
            <p className="min-h-20 text-sm leading-6 text-slate-600">{service.body}</p>
            <Link
              href={service.href}
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Open
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
