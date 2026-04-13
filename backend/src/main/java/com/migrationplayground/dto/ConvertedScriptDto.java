package com.migrationplayground.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class ConvertedScriptDto {
    private UUID migrationRunId;
    private String convertedSql;
}
