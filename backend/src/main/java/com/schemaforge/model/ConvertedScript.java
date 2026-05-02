package com.schemaforge.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "converted_scripts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConvertedScript {
    @jakarta.persistence.Id
    private UUID migrationRunId;

    @jakarta.persistence.Column(name = "original_sql", columnDefinition = "TEXT")
    private String originalSql;

    @jakarta.persistence.Column(name = "converted_sql", columnDefinition = "TEXT")
    private String convertedSql;
}
