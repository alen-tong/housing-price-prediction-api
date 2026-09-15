package com.housing.market.dto;

public record WhatIfResponse(
        HousingFeaturesRequest input,
        double predictedPrice,
        String modelVersion
) {
}
