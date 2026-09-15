export type HousingFeatures = {
  square_footage: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  lot_size: number;
  distance_to_city_center: number;
  school_rating: number;
};

export type EstimateRecord = {
  id: number;
  label: string | null;
  features: HousingFeatures;
  predicted_price: number;
  model_version: string;
  created_at: string;
};

export type EstimateListResponse = {
  items: EstimateRecord[];
  count: number;
};

export type MarketSummary = {
  count: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  averageFeatures: Record<string, number>;
};

export type SegmentStats = {
  segment: string;
  count: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
};

export type PropertyRecord = {
  id: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize: number;
  distanceToCityCenter: number;
  schoolRating: number;
  price: number;
};

export type PagedProperties = {
  items: PropertyRecord[];
  total: number;
  page: number;
  size: number;
};

export type WhatIfResponse = {
  input: HousingFeatures;
  predictedPrice: number;
  modelVersion: string;
};
