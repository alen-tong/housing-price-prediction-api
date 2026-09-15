package com.housing.market.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.housing.market.config.AppProperties;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class HousingDatasetServiceTest {
    @TempDir
    Path tempDir;

    @Test
    void calculatesSummarySegmentsAndCsvExport() throws Exception {
        Path csv = tempDir.resolve("housing.csv");
        Files.writeString(csv, """
                id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,price
                1,1000,2,1,1980,4000,2.0,6.5,150000
                2,2000,3,2,2005,8000,5.0,8.0,300000
                3,2500,4,3,2010,10000,7.0,9.0,450000
                """);
        HousingDatasetService service = new HousingDatasetService(
                new AppProperties(csv.toString(), "http://localhost:8000")
        );

        service.load();

        assertThat(service.rowCount()).isEqualTo(3);
        assertThat(service.summary().averagePrice()).isEqualTo(300000);
        assertThat(service.segments("bedrooms")).hasSize(3);
        assertThat(service.properties(0, 2, "price", "desc", null, null, null).items())
                .hasSize(2)
                .first()
                .extracting("price")
                .isEqualTo(450000.0);
        assertThat(service.exportCsv(3, null, null))
                .contains("id,square_footage")
                .contains("2,2000.00,3,2.00");
    }
}
