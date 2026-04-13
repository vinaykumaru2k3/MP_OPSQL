package com.migrationplayground.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConvertedScriptDto {
    private UUID migrationRunId;
    private String convertedSql;
}
