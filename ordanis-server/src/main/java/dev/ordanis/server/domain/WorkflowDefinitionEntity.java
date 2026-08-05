package dev.ordanis.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_definitions")
public class WorkflowDefinitionEntity {
    @Id
    private UUID id;
    private String name;
    @Column(name = "definition_version")
    private int definitionVersion;
    @Column(name = "definition_json", columnDefinition = "text")
    private String definitionJson;
    @Column(name = "created_at")
    private Instant createdAt;
    @Version
    @Column(name = "entity_version")
    private long entityVersion;

    protected WorkflowDefinitionEntity() {}

    public WorkflowDefinitionEntity(UUID id, String name, int definitionVersion, String definitionJson, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.definitionVersion = definitionVersion;
        this.definitionJson = definitionJson;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public int getDefinitionVersion() { return definitionVersion; }
    public String getDefinitionJson() { return definitionJson; }
    public Instant getCreatedAt() { return createdAt; }
}
