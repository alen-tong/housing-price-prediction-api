package com.housing.market.dto;

import java.util.Map;

public record MarketSummaryResponse(
        long count,
        double averagePrice,
        double minPrice,
        double maxPrice,
        Map<String, Double> averageFeatures
) {
}
