# ADR 0001: Pull-based worker leasing

**Decision:** Workers request tasks; the server atomically leases the best eligible task.

**Why:** Pull naturally respects worker availability, avoids assigning work to dead workers, and keeps phase-one coordination inside one durable transaction.

**Trade-off:** The scheduler cannot globally optimize every worker/task pairing. Push assignment or a broker may be justified later when measured scale requires it.
