package com.housing.market.controller;

import com.housing.market.config.AppProperties;
import com.housing.market.dto.HealthResponse;
import com.housing.market.dto.HousingFeaturesRequest;
import com.housing.market.dto.MarketSummaryResponse;
import com.housing.market.dto.MlPredictionResponse;
import com.housing.market.dto.PagedPropertiesResponse;
import com.housing.market.dto.SegmentStatsResponse;
import com.housing.market.dto.WhatIfResponse;
import com.housing.market.service.HousingDatasetService;
import com.housing.market.service.MlApiClient;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "*")
@RestController
public class MarketController {
    private final HousingDatasetService datasetService;
    private final MlApiClient mlApiClient;
    private final AppProperties properties;

    public MarketController(
            HousingDatasetService datasetService,
            MlApiClient mlApiClient,
            AppProperties properties
    ) {
        this.datasetService = datasetService;
        this.mlApiClient = mlApiClient;
        this.properties = properties;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok", datasetService.rowCount(), properties.mlApiUrl());
    }

    @GetMapping("/market/summary")
    public MarketSummaryResponse summary() {
        return datasetService.summary();
    }

    @GetMapping("/market/segments")
    public List<SegmentStatsResponse> segments(
            @RequestParam(defaultValue = "bedrooms") String groupBy
    ) {
        return datasetService.segments(groupBy);
    }

    @GetMapping("/market/properties")
    public PagedPropertiesResponse properties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "price") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice
    ) {
        return datasetService.properties(page, size, sort, direction, bedrooms, minPrice, maxPrice);
    }

    @PostMapping("/market/what-if")
    public WhatIfResponse whatIf(@Valid @RequestBody HousingFeaturesRequest request) {
        MlPredictionResponse prediction = mlApiClient.predict(request);
        double predictedPrice = prediction.predictions().isEmpty() ? 0 : prediction.predictions().getFirst();
        return new WhatIfResponse(request, predictedPrice, prediction.model_version());
    }

    @GetMapping("/market/export.csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice
    ) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=market-export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(datasetService.exportCsv(bedrooms, minPrice, maxPrice));
    }
}
