package com.housing.market.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

public record HousingFeaturesRequest(
        @Positive double square_footage,
        @Min(0) @Max(20) int bedrooms,
        @DecimalMin("0.0") @DecimalMax("20.0") double bathrooms,
        @Min(1800) @Max(2100) int year_built,
        @Positive double lot_size,
        @DecimalMin("0.0") double distance_to_city_center,
        @DecimalMin("0.0") @DecimalMax("10.0") double school_rating
) {
}
