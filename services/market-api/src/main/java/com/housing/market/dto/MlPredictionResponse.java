package com.housing.market.dto;

import java.util.List;

public record MlPredictionResponse(
        List<Double> predictions,
        int count,
        String model_version
) {
}
