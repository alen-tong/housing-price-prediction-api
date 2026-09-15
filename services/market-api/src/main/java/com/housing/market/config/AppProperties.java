package com.housing.market.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String housingDatasetPath,
        String mlApiUrl
) {
}
