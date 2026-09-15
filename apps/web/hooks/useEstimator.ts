"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { createEstimate, getEstimateHistory } from "@/lib/api";
import type { EstimateRecord, HousingFeatures } from "@/lib/types";

export const housingFeatureSchema = z.object({
  label: z.string().max(120).optional(),
  square_footage: z.coerce.number().positive("Square footage must be positive."),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().min(0).max(20),
  year_built: z.coerce.number().int().min(1800).max(2100),
  lot_size: z.coerce.number().positive("Lot size must be positive."),
  distance_to_city_center: z.coerce.number().min(0),
  school_rating: z.coerce.number().min(0).max(10),
});

export type EstimateFormValues = z.infer<typeof housingFeatureSchema>;

export function useEstimator(initialHistory: EstimateRecord[] = []) {
  const [history, setHistory] = useState<EstimateRecord[]>(initialHistory);
  const [latest, setLatest] = useState<EstimateRecord | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await getEstimateHistory();
    setHistory(response.items);
  }, []);

  useEffect(() => {
    if (!initialHistory.length) {
      refresh().catch(() => undefined);
    }
  }, [initialHistory.length, refresh]);

  async function submit(rawValues: Record<string, FormDataEntryValue>) {
    setIsLoading(true);
    setApiError(null);
    setErrors({});

    const parsed = housingFeatureSchema.safeParse(rawValues);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      setIsLoading(false);
      return;
    }

    try {
      const record = await createEstimate(parsed.data as HousingFeatures & { label?: string });
      setLatest(record);
      setHistory((current) => [record, ...current.filter((item) => item.id !== record.id)]);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to create estimate.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    history,
    latest,
    errors,
    isLoading,
    apiError,
    submit,
    refresh,
  };
}
