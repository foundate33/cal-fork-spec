# cal.com vs Cal Fork: Architecture & Feature Comparison

Research conducted 2026-07-05 against cal.com v6.2.0 and the Cal Fork spec at `main.tsp`.

---

## 1. Data Model / Entities

### Entities cal.com has that Cal Fork doesn't

| Entity | cal.com model (Prisma) | Cal Fork | Impact |
|--------|----------------------|----------|--------|
| **User** | Full user model with email, password, locale, timezone, brand colors, auth providers (CAL/GOOGLE/SAML/AZUREAD), 2FA, API keys | None — `authorId` is just a string. No user management. | Can't manage user profiles, preferences, or authentication |
| **Team** | Hierarchical teams with `Team.parentId` (orgs → teams), `Membership` (role: MEMBER/ADMIN/OWNER), `SchedulingType` (ROUND_ROBIN/COLLECTIVE/MANAGED) | None | No multi-user event types, no round-robin/collective/managed events |
| **Schedule** | Named schedules with per-day availability + date overrides. Users can have multiple schedules; event types can point to a specific schedule | `AvailabilityRule` — flat list of weekly rules with no schedule grouping | No schedule grouping, no date overrides, no default vs custom schedule |
| **Credential** | OAuth tokens for calendar/video/conferencing integrations (Google Calendar, Office365, Zoom, Google Meet, etc.) | None — `zoomLink` is a hardcoded string on EventType | No dynamic conferencing, no calendar sync, no real integration ecosystem |
| **DestinationCalendar** | Per-user/per-event-type calendar where events are created | None | Bookings don't create calendar events |
| **SelectedCalendar** | Calendars to check for busy time conflicts | None | No double-booking prevention against external calendars |
| **Webhook** | Triggerable on 15+ event types (BOOKING_CREATED, MEETING_ENDED, etc.) with subscriber URL + payload template | None | No event-driven integrations |
| **Workflow** | Email/SMS reminders, confirmations, follow-ups triggered on booking lifecycle events | None | No automated notifications |
| **Payment** | Stripe integration with `PaymentOption.ON_BOOKING` / `HOLD` | None | No paid events |
| **App** | App store ecosystem with `AppCategories` (calendar, video, payment, crm, automation, etc.) | None | No app marketplace |
| **RoutingForm** | Questionnaire-based routing that assigns bookings to team members | None | No smart assignment |
| **HashedLink** | Private booking links with expiry and max usage | None | No private/shared booking links |
| **Attribute / AttributeToUser** | Org-managed user attributes for routing and filtering | None | No attribute-based routing |
| **OutOfOfficeEntry** | Calendar-based OOO periods with redirect to another user | None | No OOO handling |
| **BookingSeat** | Per-seat tracking for seated (collective) event types | None | No multi-person per-slot bookings |
| **InstantMeetingToken** | Token-based instant meeting creation | None | No instant meetings |
| **CalVideoSettings** | Per-event-type Cal Video recording/transcription settings | None | No video recording control |
| **Agent / CalAiPhoneNumber** | AI phone agent for inbound/outbound calls | None | No AI calling |
| **PlatformOAuthClient / DelegationCredential** | OAuth-based platform API access | None | No platform/OAuth model |

**Source**: cal.com Prisma schema at `packages/prisma/schema.prisma` (~2850 lines, 100+ models), fetched from `github.com/calcom/cal.com` main branch.

---

## 2. Event Types — Depth Comparison

### cal.com EventType (Prisma model)
```prisma
model EventType {
  id                      Int
  title                   String
  slug                    String
  length                  Int           // duration
  offsetStart             Int           // slot offset from hour
  locations               Json?         // array of location objects
  schedulingType          SchedulingType? // null (individual), ROUND_ROBIN, COLLECTIVE, MANAGED
  hosts                   Host[]        // team event host assignments
  teamId                  Int?          // team ownership
  recurringEvent          Json?         // recurring frequency config
  seatsPerTimeSlot        Int?          // seated event capacity
  requiresConfirmation    Boolean       // manual approval needed
  minimumBookingNotice    Int           // min notice in minutes
  beforeEventBuffer       Int           // buffer before
  afterEventBuffer        Int           // buffer after
  slotInterval            Int?          // custom slot interval
  scheduleId              Int?          // override default schedule
  bookingLimits           Json?         // per-day/week/month count limits
  durationLimits          Json?         // per-day/week/month duration limits
  periodType              PeriodType    // booking window (UNLIMITED/ROLLING/RANGE)
  bookingFields           Json?         // custom booking form fields
  successRedirectUrl      String?
  metadata                Json?
  // ... 85+ fields total
}
```

### Cal Fork EventType (main.tsp)
```
title, description, durationMinutes, zoomLink, slug, authorId, bookingLink, createdAt, updatedAt
```
9 fields vs ~85+. Cal Fork hardcodes `zoomLink` as a required string. cal.com stores locations as a JSON array supporting address, link, integration-based (Cal Video, Zoom, Google Meet, etc.), phone, and attendee-defined locations.

**Source**: cal.com Prisma schema (`model EventType`); Cal Fork `main.tsp:57-68`.

### Key structural gaps in Cal Fork:
1. **No team ownership**: Event types are always individual (`authorId` scoped). cal.com has `teamId` + `Host` join table.
2. **No scheduling types**: Cal Fork doesn't model `SchedulingType` enum (ROUND_ROBIN, COLLECTIVE, MANAGED).
3. **No booking fields**: Cal Fork has a fixed `BookerInfo` (name + email + notes). cal.com supports 18+ field types.
4. **No booking windows**: Cal Fork has no `periodType`/`bookingLimits`/`bookingWindow`.
5. **No confirmation flow**: Cal Fork auto-accepts. cal.com supports `requiresConfirmation` with PENDING status.
6. **No recurring events**: cal.com supports `recurringEvent` JSON config.

---

## 3. Availability / Schedules

### cal.com
- **Named schedules**: Users create named schedules (e.g., "Work Hours", "Weekend"). One is the default.
- **Per-user availability**: Each user can have multiple schedules.
- **Per-event-type schedule**: An event type can override the default schedule.
- **Date overrides**: `ScheduleOverrideInput` — specific date ranges override normal schedule (e.g., holiday hours).
- **Availabilty data model**: `Availability` model with `days[]` (int), `startTime`/`endTime` (Time), optional `date` (Date), linked to either `Schedule` or `EventType` or `User`.
- **Travel schedules**: `TravelSchedule` model for timezone changes during travel.
- **Timezone**: Each schedule has its own `timeZone`. Each user has a default `timeZone`. Event types can have `timeZone`, `lockTimeZoneToggleOnBookingPage`.

**Source**: cal.com Prisma schema (`model Schedule`, `model Availability`, `model TravelSchedule`); API v2 Schedules docs at `cal.com/docs/api-reference/v2/schedules/create-a-schedule`.

### Cal Fork (`main.tsp:92-126`)
- **Flat rules**: `AvailabilityRule` — a list of day-of-week + time ranges, each with a `timezone`.
- **No named grouping**: Rules aren't grouped into schedules.
- **No date overrides**: Only recurring weekly rules.
- **No event-type-specific overrides**: Same availability rules apply to all event types.
- **No travel schedules**.
- **No default schedule concept**.

### API shape difference
cal.com *GET /v2/slots* takes a *date range* (`start`/`end`) spanning multiple days, with optional `timeZone`/`duration`/`bookingUidToReschedule`. Cal Fork *GET /slots* takes a single `date`. cal.com's API supports rescheduling exclusions; Cal Fork's does not.

**Source**: cal.com API v2 Slots docs at `cal.com/docs/api-reference/v2/slots`; Cal Fork `main.tsp:210-219`.

---

## 4. Booking Flow

### cal.com Booking states
```
BookingStatus: CANCELLED | ACCEPTED | REJECTED | PENDING | AWAITING_HOST
```
Cal Fork only has confirmed bookings (no status field on `Booking`, `main.tsp:138-146`).

### cal.com booking types
1. **Regular**: Single booking against an individual event type.
2. **Recurring**: Multiple bookings from a recurring event type.
3. **Instant**: Team event type booked instantly without slot selection (requires `InstantMeetingToken`).
4. **Seated**: Multiple attendees in the same time slot (collective events).
5. **Dynamic**: Ad-hoc booking between 2+ users (no event type).

Cal Fork only supports **regular** bookings.

### cal.com booking identification
- Two ways to identify an event type for booking: `eventTypeId` (number) or `eventTypeSlug` + `username`/`teamSlug`.
- Cal Fork uses only `slug` via path (`/book/{slug}`).

### cal.com booking features missing from Cal Fork
- **Rescheduling**: Full `reschedule`/`requestReschedule` endpoints. Cal Fork has none.
- **Cancellation**: `cancel` endpoint with reason. Cal Fork has none.
- **Guests**: `guests[]` field. Cal Fork has none (`BookerInfo` has only `notes`).
- **Attendee timezone**: `attendee.timeZone` is required. Cal Fork doesn't collect it.
- **Routing form response**: `routing` field on booking input (responseId + teamMemberIds).
- **Booking field responses**: `bookingFieldsResponses` object — Cal Fork uses the fixed `BookerInfo`.
- **Multiple locations per event type**: `locations` array on event type, booker picks one.

**Source**: cal.com API v2 Bookings docs at `cal.com/docs/api-reference/v2/bookings/create-a-booking`.

---

## 5. Auth Model

### cal.com (three authentication methods)

| Method | How it works | Scope |
|--------|-------------|-------|
| **API Key** | `Authorization: Bearer cal_xxx` header. Created via Settings > Security. 120 req/min rate limit. | User-level, no OAuth scopes |
| **OAuth 2.0** | Full OAuth flow with authorization code grant. OAuth clients managed via platform dashboard. | Scoped: `EVENT_TYPE_READ`, `PROFILE_WRITE`, `SCHEDULE_WRITE`, etc. |
| **Platform Managed Users** | `x-cal-client-id` + `x-cal-secret-key` headers + Bearer token with 60-min expiry. Refresh token rotation. | Managed user's resources |

cal.com also has:
- **NextAuth.js** integration for web app sessions (credentials, Google, SAML, Azure AD).
- **Role-based access**: `UserPermissionRole.USER | ADMIN`, `MembershipRole.MEMBER | ADMIN | OWNER`.
- **PBAC**: Permission-based access control for org-level API endpoints.

**Source**: cal.com API v2 Introduction docs at `cal.com/docs/api-reference/v2/introduction`; Prisma schema (`model User`, `model Account`, `model Session`, `model ApiKey`, `model PlatformOAuthClient`).

### Cal Fork
```tsp
model AuthorizedRequest {
  @header "x-user-id": string;
}
```
- **Single header-based auth**: `x-user-id` is a plain string stored in `localStorage`.
- **No auth**: No login, no registration, no password, no OAuth, no API keys.
- **No roles**: Every user is equal.
- **No sessions/tokens**: Frontend reads `localStorage` and sends the header.

**Source**: `main.tsp:11-13`, `frontend/src/context/AuthContext.tsx`, `AGENTS.md`.

---

## 6. Frontend Architecture

### cal.com

| Aspect | cal.com | Cal Fork |
|--------|--------|----------|
| **Framework** | Next.js 16.2.3 (React 18) | React 18 + Vite |
| **Routing** | Next.js file-based routing + tRPC for data fetching | `react-router-dom` (declarative in `App.tsx`) |
| **State mgmt** | tRPC (server-state), Jotai (client-state) | Local component state via Mantine form hooks |
| **API layer** | tRPC (primary) + REST API v2 (secondary) | Direct HTTP via `api/http.ts` |
| **UI kit** | Radix UI primitives + Tailwind CSS + custom `@calcom/ui` | Mantine v7 |
| **Form handling** | react-hook-form + zod | `@mantine/form` |
| **Auth flow** | NextAuth.js (credentials, OAuth, SAML) | Fake: localStorage `x-user-id` |
| **Monorepo** | Turborepo with 30+ packages (`@calcom/features`, `@calcom/ui`, `@calcom/prisma`, etc.) | Flat repo with `frontend/` subdirectory |
| **Embedding** | `@calcom/embed-core` / `@calcom/embed-react` — npm-published embeddable booking widgets | None |
| **Platform atoms** | React components published to npm (`@calcom/atoms`) for embedding scheduling | None |
| **i18n** | next-i18next with 30+ locales | None (hardcoded English in Russian comments) |
| **Testing** | Playwright E2E, Testing Library | None (per AGENTS.md) |
| **Linting** | Biome (migrated from ESLint) | oxlint |

**Source**: cal.com `apps/web/package.json`, cal.com Atoms README (`packages/platform/atoms/README.md`); Cal Fork `frontend/package.json`, `AGENTS.md`.

---

## 7. Key Features Missing from Cal Fork

### High-impact omissions

1. **Teams & Organizations** — cal.com's entire multi-user/org model is absent. This is the foundational feature that enables round-robin, collective, managed events, and enterprise use cases.

2. **Calendar Integration** — No OAuth for Google/Outlook calendars. No busy-time detection against external calendars. No destination calendar for event creation.

3. **Video Conferencing** — Hardcoded `zoomLink` string vs. cal.com's dynamic conferencing app ecosystem (Cal Video, Zoom, Google Meet, Teams, Jitsi, 30+ apps).

4. **Schedules** — Flat availability rules vs. cal.com's named schedules with overrides, travel schedules, and per-event-type schedule assignment.

5. **Recurring Events** — cal.com supports configurable recurring events (daily/weekly/monthly). Cal Fork has single-slot events only.

6. **Booking Workflow** — No rescheduling, cancellation, booking confirmation (manual approval), payment, or email/SMS workflows.

7. **Webhooks** — cal.com's webhook system with 15+ trigger events is the primary extensibility mechanism.

8. **Embedding** — cal.com's embeddable booking widget (`cal.com/embed`) is a key distribution channel.

9. **Routing Forms** — Questionnaire-based smart assignment of bookings to the right team member. Cal Fork always routes by slug to a single event type.

10. **Multi-person booking** — No collective events, no round-robin, no seats.

### Medium-impact gaps

11. **Custom booking fields** — Cal Fork has `BookerInfo` (name, email, notes). cal.com has 18+ field types (phone, address, select, multiselect, checkbox, radio, URL, etc.).

12. **Booking limits** — No per-day/week/month booking limits. No per-booker active booking limits.

13. **Booking windows** — No period type (rolling/range/unlimited). No minimum booking notice.

14. **Timezones** — `BookerInfo` doesn't collect attendee timezone. cal.com requires it.

15. **Buffers** — No `beforeEventBuffer`/`afterEventBuffer`/`offsetStart`.

16. **Seats** — No `seatsPerTimeSlot` for collective attendee tracking.

17. **Private/shared links** — No `HashedLink` model for private booking links with expiry.

18. **Analytics / Insights** — No booking KPI stats, trends, or member stats.

---

## 8. Differences in How Similar Concepts Are Modeled

### Event Types
| Concept | cal.com | Cal Fork |
|---------|--------|----------|
| Duration | `length` (Int) + `lengthInMinutesOptions` (Int[]) for variable duration | `durationMinutes` (Int) only |
| Location | `locations` (Json array — up to 30 types) | `zoomLink` (single string) |
| Owner | `userId` (optional) + `teamId` (optional) | `authorId` (string) |
| Slug uniqueness | `@@unique([userId, slug])`, `@@unique([teamId, slug])` | Simple `slug: string` |
| Visibility | `hidden` (Boolean) | Absent |

### Slots
| Concept | cal.com | Cal Fork |
|---------|--------|----------|
| Query scope | Date range (`start` + `end`), can span days | Single `date` (plainDate) |
| Rescheduling | `bookingUidToReschedule` query param excludes existing booking | None |
| Format | Can return as time strings or range objects (`start`/`end`) | Only `startTime`/`endTime` |
| Duration | `duration` param for variable-length event types | Only one duration per event type |
| Identification | By `eventTypeId`, `eventTypeSlug+username`, `eventTypeSlug+teamSlug`, or `usernames` array | By `eventTypeId` only |

### Bookings
| Concept | cal.com | Cal Fork |
|---------|--------|----------|
| Status | 5-state (pending → accepted/rejected/cancelled) | No status — always accepted |
| ID | `uid` (UUID, for public) + `id` (Int, internal) | `id` (string) |
| Attendees | Array of `Attendee` with name, email, timezone, locale, phone | Single `BookerInfo` (name, email, notes) |
| Hosts | Array of `BookingHost` (id, name, email, username, timezone) | Implicit from `authorId` |
| Rescheduling | Full workflow: request → reschedule with reasons, uid tracking | None |
| Cancellation | `cancelledBy`, cancellationReason, status transition | None |
| Recurring | Linked via `recurringBookingUid` | None |
| Seated | `seatUid` tracking per attendee | None |
| Payment | `paid` flag, `Payment[]` relation | None |
| Metadata | `metadata` (JSON object, up to 50 keys) | None |
| Booking field responses | `bookingFieldsResponses` (JSON) | Fixed structure only |
| External calendar refs | `BookingReference` with `type`/`uid`/`meetingId`/`meetingUrl`/`thirdPartyRecurringEventId` | None |
| Routing trace | `routing` field + dedicated `getRoutingTrace` endpoint | None |
| Cal video settings | `calVideoSettings` relation | None |
| Booking audit | `BookingAudit` model with type, action, source, context, operationId | None |

### Availability
| Concept | cal.com | Cal Fork |
|---------|--------|----------|
| Grouping | Named `Schedule` objects | Flat `AvailabilityRule` list |
| Date overrides | `overrides` array on schedule (date + startTime + endTime) | None |
| Per-event override | `scheduleId` on event type | Not possible (all rules apply to all event types) |
| Default schedule | `isDefault` flag on schedule | Not applicable |
| Travel | `TravelSchedule` with date range + timezone | None |

---

## 9. Summary of Most Impactful Differences

In order of priority for a Cal Fork → cal.com-alignment roadmap:

1. **No User/Team model** — Cal Fork has no concept of users, teams, or organizations. Every other feature depends on this. Without it, there's no multi-user scheduling, no round-robin, no ownership model.

2. **No calendar/conferencing integrations** — The `zoomLink` field as a hardcoded string is the single biggest divergence from cal.com's architecture. cal.com's entire value proposition is its integration ecosystem (30+ conferencing apps, 3+ calendar providers, CRMs, automation).

3. **Flat availability vs. named schedules** — Cal Fork's `AvailabilityRule` list works for trivial single-user cases but can't handle multiple schedules, date overrides, travel, or per-event-type availability.

4. **No booking lifecycle** — No rescheduling, cancellation, confirmation, payment, or notification workflows. cal.com's booking state machine (5 states, triggers for webhooks/workflows, audit logging) is core to its utility.

5. **Single-booking only** — No recurring events, no seated events, no round-robin/collective/managed scheduling types.

6. **No extensibility points** — No webhooks, no app store, no platform OAuth, no embeddable booking widget, no custom booking fields.

7. **Fake auth** — The `x-user-id` header is a development shortcut that replaces cal.com's full authentication system (multi-provider, 2FA, API keys, OAuth, RBAC/PBAC).

### What Cal Fork does right (that matches cal.com philosophy)

- **Slug-based public booking URLs**: `/book/{slug}` matches cal.com's public booking pattern.
- **Clean separation of author vs. booker interfaces**: Mirrors cal.com's distinction between the dashboard (event types, availability) and the booking page.
- **RESTful resource naming**: `/event-types`, `/availability`, `/calendar` align with cal.com's API v2 conventions.

---

## Sources

- cal.com API v2 docs: https://cal.com/docs/api-reference/v2 (fetched 2026-07-05)
- cal.com Prisma schema: https://github.com/calcom/cal.com/blob/main/packages/prisma/schema.prisma (fetched 2026-07-05)
- cal.com Atoms README: https://github.com/calcom/cal.com/blob/main/packages/platform/atoms/README.md (fetched 2026-07-05)
- cal.com web package.json: https://github.com/calcom/cal.com/blob/main/apps/web/package.json (fetched 2026-07-05)
- Cal Fork spec: `main.tsp` (280 lines)
- Cal Fork frontend client: `frontend/src/api/client.ts`
- Cal Fork architecture notes: `AGENTS.md`