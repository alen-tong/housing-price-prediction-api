package com.housing.market.dto;

import com.housing.market.model.PropertyRecord;
import java.util.List;

public record PagedPropertiesResponse(
        List<PropertyRecord> items,
        long total,
        int page,
        int size
) {
}
