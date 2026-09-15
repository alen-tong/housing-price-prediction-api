package com.housing.market.service;

import com.housing.market.config.AppProperties;
import com.housing.market.dto.HousingFeaturesRequest;
import com.housing.market.dto.MlPredictionResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class MlApiClient {
    private final String mlApiUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public MlApiClient(AppProperties properties, ObjectMapper objectMapper) {
        this.mlApiUrl = properties.mlApiUrl();
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
    }

    public MlPredictionResponse predict(HousingFeaturesRequest request) {
        Map<String, Object> payload = Map.of(
                "square_footage", request.square_footage(),
                "bedrooms", request.bedrooms(),
                "bathrooms", request.bathrooms(),
                "year_built", request.year_built(),
                "lot_size", request.lot_size(),
                "distance_to_city_center", request.distance_to_city_center(),
                "school_rating", request.school_rating()
        );
        try {
            String body = objectMapper.writeValueAsString(payload);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(mlApiUrl + "/predict"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("ML API returned " + response.statusCode() + ": " + response.body());
            }
            return objectMapper.readValue(response.body(), MlPredictionResponse.class);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Failed to call ML API", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to call ML API", exception);
        }
    }
}
