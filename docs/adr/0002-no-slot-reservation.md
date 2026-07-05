# Slots are not reserved — first come, first served

Slots are computed ephemerally and shown to the booker without any temporary lock or reservation. If two bookers see the same slot and both submit a booking, the first successful `POST` wins; the second receives a conflict error.

## Context

When a booker opens the public booking page at `/book/{slug}`, the system returns a list of available `Slot` values. The booker selects one, fills in their details, and submits. There is no mechanism to hold or reserve a slot while the booker is filling out the form.

Without reservation, the slot may become unavailable between page load and form submission (another booker booked it in the meantime, or the host changed their availability).

## Decision

Do not implement slot reservation. The booking API is purely stateless with respect to slot availability — the server validates availability only at the moment of `POST /book/{slug}/book` and rejects the request if the slot is no longer free.

## Consequences

**Positive:**
- No complexity from lock management (timeouts, deadlocks, stale reservations)
- No background jobs to clean up expired reservations
- No session state to track which booker is looking at which slot
- Simple idempotent POST — the server is the single source of truth

**Negative:**
- Booker may fill out the form and receive a "slot already taken" error
- Frontend must handle this gracefully: reload slots after conflict, notify the user
- Without optimistic locking in the API, two concurrent requests can double-book (backend must enforce uniqueness at the database level — e.g., unique constraint on `(host_id, start_time)`)

## Alternatives considered

**Temporary reservation (5-minute lock).** Store a pending claim on a slot when the booker selects it; release after timeout or on explicit cancel. Rejected because: (a) adds session management to a currently stateless API, (b) requires a background sweeper for expired locks, (c) still doesn't eliminate conflicts (two bookers can select the same slot at nearly the same time).