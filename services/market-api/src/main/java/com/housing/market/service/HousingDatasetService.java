package com.housing.market.service;

import com.housing.market.config.AppProperties;
import com.housing.market.dto.MarketSummaryResponse;
import com.housing.market.dto.PagedPropertiesResponse;
import com.housing.market.dto.SegmentStatsResponse;
import com.housing.market.model.PropertyRecord;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class HousingDatasetService {
    private final AppProperties properties;
    private List<PropertyRecord> records = List.of();

    public HousingDatasetService(AppProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    public void load() throws IOException {
        Path path = Path.of(properties.housingDatasetPath()).normalize();
        try (Stream<String> lines = Files.lines(path)) {
            records = lines.skip(1)
                    .filter(line -> !line.isBlank())
                    .map(this::parseRecord)
                    .toList();
        }
    }

    public int rowCount() {
        return records.size();
    }

    @Cacheable("marketSummary")
    public MarketSummaryResponse summary() {
        DoubleSummaryStatistics priceStats = records.stream()
                .mapToDouble(PropertyRecord::price)
                .summaryStatistics();
        Map<String, Double> averageFeatures = Map.of(
                "squareFootage", average(PropertyRecord::squareFootage),
                "bedrooms", average(record -> record.bedrooms()),
                "bathrooms", average(PropertyRecord::bathrooms),
                "yearBuilt", average(record -> record.yearBuilt()),
                "lotSize", average(PropertyRecord::lotSize),
                "distanceToCityCenter", average(PropertyRecord::distanceToCityCenter),
                "schoolRating", average(PropertyRecord::schoolRating)
        );
        return new MarketSummaryResponse(
                records.size(),
                round(priceStats.getAverage()),
                round(priceStats.getMin()),
                round(priceStats.getMax()),
                averageFeatures
        );
    }

    @Cacheable(value = "marketSegments", key = "#groupBy")
    public List<SegmentStatsResponse> segments(String groupBy) {
        Function<PropertyRecord, String> classifier = classifierFor(groupBy);
        return records.stream()
                .collect(Collectors.groupingBy(classifier))
                .entrySet()
                .stream()
                .map(entry -> toSegmentStats(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(SegmentStatsResponse::segment))
                .toList();
    }

    public PagedPropertiesResponse properties(
            int page,
            int size,
            String sort,
            String direction,
            Integer bedrooms,
            Double minPrice,
            Double maxPrice
    ) {
        List<PropertyRecord> filtered = filterRecords(bedrooms, minPrice, maxPrice);
        Comparator<PropertyRecord> comparator = comparatorFor(sort);
        if ("desc".equalsIgnoreCase(direction)) {
            comparator = comparator.reversed();
        }
        List<PropertyRecord> sorted = filtered.stream().sorted(comparator).toList();
        int from = Math.min(Math.max(page, 0) * Math.max(size, 1), sorted.size());
        int to = Math.min(from + Math.max(size, 1), sorted.size());
        return new PagedPropertiesResponse(sorted.subList(from, to), filtered.size(), page, size);
    }

    public String exportCsv(Integer bedrooms, Double minPrice, Double maxPrice) {
        List<PropertyRecord> filtered = filterRecords(bedrooms, minPrice, maxPrice);
        List<String> lines = new ArrayList<>();
        lines.add("id,square_footage,bedrooms,bathrooms,year_built,lot_size,distance_to_city_center,school_rating,price");
        filtered.stream().map(this::toCsvLine).forEach(lines::add);
        return String.join("\n", lines) + "\n";
    }

    private List<PropertyRecord> filterRecords(Integer bedrooms, Double minPrice, Double maxPrice) {
        return records.stream()
                .filter(record -> bedrooms == null || record.bedrooms() == bedrooms)
                .filter(record -> minPrice == null || record.price() >= minPrice)
                .filter(record -> maxPrice == null || record.price() <= maxPrice)
                .toList();
    }

    private SegmentStatsResponse toSegmentStats(String segment, List<PropertyRecord> values) {
        DoubleSummaryStatistics stats = values.stream()
                .mapToDouble(PropertyRecord::price)
                .summaryStatistics();
        return new SegmentStatsResponse(
                segment,
                values.size(),
                round(stats.getAverage()),
                round(stats.getMin()),
                round(stats.getMax())
        );
    }

    private Function<PropertyRecord, String> classifierFor(String groupBy) {
        return switch (Objects.toString(groupBy, "bedrooms").toLowerCase(Locale.ROOT)) {
            case "schoolrating", "school_rating" -> record -> {
                if (record.schoolRating() >= 8.5) return "excellent_schools";
                if (record.schoolRating() >= 7.0) return "good_schools";
                return "standard_schools";
            };
            case "bathrooms" -> record -> String.valueOf(record.bathrooms());
            case "yearbuilt", "year_built" -> record -> {
                if (record.yearBuilt() >= 2005) return "newer_2005_plus";
                if (record.yearBuilt() >= 1990) return "mid_1990_2004";
                return "older_before_1990";
            };
            default -> record -> String.valueOf(record.bedrooms());
        };
    }

    private Comparator<PropertyRecord> comparatorFor(String sort) {
        return switch (Objects.toString(sort, "price").toLowerCase(Locale.ROOT)) {
            case "squarefootage", "square_footage" -> Comparator.comparing(PropertyRecord::squareFootage);
            case "bedrooms" -> Comparator.comparing(PropertyRecord::bedrooms);
            case "bathrooms" -> Comparator.comparing(PropertyRecord::bathrooms);
            case "yearbuilt", "year_built" -> Comparator.comparing(PropertyRecord::yearBuilt);
            case "lotsize", "lot_size" -> Comparator.comparing(PropertyRecord::lotSize);
            case "distancetocitycenter", "distance_to_city_center" -> Comparator.comparing(PropertyRecord::distanceToCityCenter);
            case "schoolrating", "school_rating" -> Comparator.comparing(PropertyRecord::schoolRating);
            default -> Comparator.comparing(PropertyRecord::price);
        };
    }

    private PropertyRecord parseRecord(String line) {
        String[] values = line.split(",", -1);
        if (values.length < 9) {
            throw new IllegalArgumentException("Invalid housing dataset row: " + line);
        }
        return new PropertyRecord(
                Long.parseLong(values[0]),
                Double.parseDouble(values[1]),
                Integer.parseInt(values[2]),
                Double.parseDouble(values[3]),
                Integer.parseInt(values[4]),
                Double.parseDouble(values[5]),
                Double.parseDouble(values[6]),
                Double.parseDouble(values[7]),
                Double.parseDouble(values[8])
        );
    }

    private String toCsvLine(PropertyRecord record) {
        return "%d,%.2f,%d,%.2f,%d,%.2f,%.2f,%.2f,%.2f".formatted(
                record.id(),
                record.squareFootage(),
                record.bedrooms(),
                record.bathrooms(),
                record.yearBuilt(),
                record.lotSize(),
                record.distanceToCityCenter(),
                record.schoolRating(),
                record.price()
        );
    }

    private double average(ToDoubleFunction function) {
        return round(records.stream().mapToDouble(function::apply).average().orElse(0));
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    @FunctionalInterface
    private interface ToDoubleFunction {
        double apply(PropertyRecord record);
    }
}
