package com.housing.market.dto;

public record HealthResponse(
        String status,
        int datasetRows,
        String mlApiUrl
) {
}
