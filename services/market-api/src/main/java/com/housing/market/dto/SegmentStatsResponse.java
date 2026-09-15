package com.housing.market.dto;

public record SegmentStatsResponse(
        String segment,
        long count,
        double averagePrice,
        double minPrice,
        double maxPrice
) {
}
