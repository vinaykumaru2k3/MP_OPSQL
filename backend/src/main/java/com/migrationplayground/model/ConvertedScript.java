package com.migrationplayground.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class ConvertedScript {
    private UUID migrationRunId;
    private String originalSql;
    private String convertedSql;
}
