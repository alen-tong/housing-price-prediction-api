package com.housing.market.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.housing.market.config.AppProperties;
import com.housing.market.dto.HousingFeaturesRequest;
import com.housing.market.dto.MlPredictionResponse;
import com.housing.market.dto.WhatIfResponse;
import com.housing.market.service.HousingDatasetService;
import com.housing.market.service.MlApiClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MarketControllerTest {
    @TempDir
    Path tempDir;

    @Test
    void whatIfReturnsPredictionFromMlApi() throws Exception {
        AppProperties properties = new AppProperties(createDataset().toString(), "http://ml-api:8000");
        HousingDatasetService datasetService = new HousingDatasetService(properties);
        datasetService.load();
        MarketController controller = new MarketController(
                datasetService,
                new FakeMlApiClient(),
                properties
        );

        WhatIfResponse response = controller.whatIf(new HousingFeaturesRequest(
                1550,
                3,
                2,
                1997,
                6800,
                4.1,
                7.6
        ));

        assertThat(response.predictedPrice()).isEqualTo(250829.56);
        assertThat(response.modelVersion()).isEqualTo("test-model");
    }

    private Path createDataset() throws Exception {
        Path csv = tempDir.resolve("housing.csv");
        Files.writeString(csv, """
                id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,price
                1,1000,2,1,1980,4000,2.0,6.5,150000
                """);
        return csv;
    }

    private static class FakeMlApiClient extends MlApiClient {
        FakeMlApiClient() {
            super(new AppProperties("unused", "http://unused"), new ObjectMapper());
        }

        @Override
        public MlPredictionResponse predict(HousingFeaturesRequest request) {
            return new MlPredictionResponse(List.of(250829.56), 1, "test-model");
        }
    }
}
