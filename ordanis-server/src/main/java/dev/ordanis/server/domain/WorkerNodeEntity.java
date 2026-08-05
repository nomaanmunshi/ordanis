package dev.ordanis.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "worker_nodes")
public class WorkerNodeEntity {
    @Id
    private UUID id;
    private String name;
    @Column(name = "capabilities_json", columnDefinition = "text")
    private String capabilitiesJson;
    @Column(name = "max_slots")
    private int maxSlots;
    private String status;
    @Column(name = "last_seen_at")
    private Instant lastSeenAt;
    @Column(name = "registered_at")
    private Instant registeredAt;
    @Version
    @Column(name = "entity_version")
    private long entityVersion;

    protected WorkerNodeEntity() {}

    public WorkerNodeEntity(UUID id, String name, String capabilitiesJson, int maxSlots, Instant now) {
        this.id = id;
        this.name = name;
        this.capabilitiesJson = capabilitiesJson;
        this.maxSlots = maxSlots;
        this.status = "ONLINE";
        this.lastSeenAt = now;
        this.registeredAt = now;
    }

    public void touch(String name, String capabilitiesJson, int maxSlots, Instant now) {
        this.name = name;
        this.capabilitiesJson = capabilitiesJson;
        this.maxSlots = maxSlots;
        seen(now);
    }

    public void seen(Instant now) {
        this.status = "ONLINE";
        this.lastSeenAt = now;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getCapabilitiesJson() { return capabilitiesJson; }
    public int getMaxSlots() { return maxSlots; }
    public String getStatus() { return status; }
    public Instant getLastSeenAt() { return lastSeenAt; }
}
