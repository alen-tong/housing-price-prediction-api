"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMarketProperties, getMarketSegments, runWhatIf } from "@/lib/api";
import type { HousingFeatures, PagedProperties, SegmentStats, WhatIfResponse } from "@/lib/types";

export function useMarket() {
  const [groupBy, setGroupBy] = useState("bedrooms");
  const [bedrooms, setBedrooms] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("price");
  const [direction, setDirection] = useState("desc");
  const [segments, setSegments] = useState<SegmentStats[]>([]);
  const [properties, setProperties] = useState<PagedProperties | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: "0",
      size: "10",
      sort,
      direction,
    });
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return params;
  }, [bedrooms, direction, maxPrice, minPrice, sort]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [nextSegments, nextProperties] = await Promise.all([
        getMarketSegments(groupBy),
        getMarketProperties(queryParams),
      ]);
      setSegments(nextSegments);
      setProperties(nextProperties);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to load market data.");
    } finally {
      setIsLoading(false);
    }
  }, [groupBy, queryParams]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function submitWhatIf(payload: HousingFeatures) {
    setIsLoading(true);
    setApiError(null);
    try {
      setWhatIfResult(await runWhatIf(payload));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to run what-if analysis.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    groupBy,
    setGroupBy,
    bedrooms,
    setBedrooms,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sort,
    setSort,
    direction,
    setDirection,
    queryParams,
    segments,
    properties,
    whatIfResult,
    isLoading,
    apiError,
    refresh,
    submitWhatIf,
  };
}
