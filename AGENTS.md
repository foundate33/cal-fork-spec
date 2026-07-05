# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This repo has three parts, each independently toolchained:

- **Root** — a TypeSpec API specification for "Cal Fork" (a Calendly-like scheduling app), compiled to OpenAPI 3.1. This is the source of truth for the domain shape.
- **`backend/`** — a Spring Boot + Kotlin + Gradle + JDBC + Liquibase implementation of that spec, backed by H2 in-memory. It implements the real endpoints (event types, slots, availability, calendar, public booking) — see Architecture below.
- **`frontend/`** — a React + Vite + Mantine UI that consumes the API. It has its own `package.json`, `node_modules`, and toolchain, entirely separate from the root.

For frontend-only work, the API can also be mocked via Prism from the generated OpenAPI spec (`make mock`) instead of running the real backend — both listen on the same port (4010), so use one or the other, not both.

## Commands

### Root (TypeSpec spec)

Run via `make` (see `Makefile`) or npm directly:

```
make install    # npm ci
make generate   # tsp compile . -> tsp-output/schema/openapi.yaml
make mock       # generate, then start a Prism mock server from the spec
make serve      # serve swagger.html via `python3 -m http.server 8080`
make clean      # rm -rf tsp-output/
```

The Prism mock server listens on `http://localhost:4010` (the frontend's `BASE_URL` — see `frontend/src/api/http.ts`), and needs to be running (or the real backend does) for the frontend to work against responses.

`main.tsp` is the single spec source file; there's no split into multiple TypeSpec files. `tspconfig.yaml` configures the OpenAPI3 emitter to output 3.1.0 to `tsp-output/schema/openapi.yaml`.

### Frontend

The `Makefile` also wraps the frontend's npm scripts (each just `cd`s into `frontend/`), so the whole stack can be driven from the root without switching directories:

```
make frontend-install   # npm install
make frontend-dev       # vite dev server
make frontend-build     # tsc -b && vite build
make frontend-lint      # oxlint
make frontend-verify    # lint + type-check + build (стандартная верификация)
make frontend-preview   # vite preview
make frontend-clean     # rm -rf frontend/dist
```

`make frontend-verify` runs lint, type-check, and build (стандартная верификация фронтенда). `make backend-lint` запускает ktlint для бэкенда. `make verify` делает то же самое для фронтенда + линтинг и тесты бэкенда.

`make dev` runs `mock` and `frontend-dev` together (via `make -j2`), as the two-terminal flow below, in one command. `make all` installs both root and frontend dependencies and generates the spec. `make clean-all` removes both generated outputs (`tsp-output/` and `frontend/dist/`).

Equivalent npm commands, run directly inside `frontend/`:

```
cd frontend
npm install
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview
```

There are no tests configured in the frontend. The backend has JUnit 5 + AssertJ tests.

### Backend

Spring Boot, Kotlin, Gradle, Spring JDBC, Liquibase, H2 in-memory, JUnit 5 + AssertJ.

Commands (also wrapped in root `Makefile`):

```
make backend-install   # generate Gradle wrapper
make backend-build     # ./gradlew build
make backend-run       # ./gradlew bootRun (serves the real API on :4010)
make backend-lint      # ./gradlew ktlintCheck
make backend-test      # ./gradlew test
make backend-clean     # rm -rf build .gradle
```

Or run directly from `backend/`:

```
./gradlew build
./gradlew bootRun
./gradlew test
```

To run a single test class: `./gradlew test --tests "com.calfork.controller.BookingControllerTest"`.

**Important conventions when implementing controllers, services, or data model:**

- **No JPA** — only Spring JDBC (`JdbcTemplate`, `NamedParameterJdbcTemplate`).
- **Liquibase** changelogs go in `src/main/resources/db/changelog/`; add `<include>` to `db.changelog-master.yaml`.
- The server runs on **port 4010** (matching the frontend's hardcoded `BASE_URL` in `frontend/src/api/http.ts`).
- Auth is faked via `x-user-id` header — match `AuthorizedRequest` from the spec.

### Testing conventions

- **Every endpoint must have integration tests.** Any change to an endpoint (new, modified behaviour, removed) must be accompanied by corresponding test changes in the same commit.
- **Base class**: new integration tests extend `AbstractIntegrationTest` (`com.calfork` package) — it provides `@SpringBootTest(RANDOM_PORT)`, `@ActiveProfiles("test")`, autowired `TestRestTemplate` and `JdbcTemplate`. All tests share one Spring context.
- **DB cleanup**: `AbstractIntegrationTest` has an `@AfterEach` method that deletes from `bookings` → `event_types` → `availability_rules`. Each test starts with a clean database.
- **Fixed test data**: because the DB is cleaned between tests, use simple fixed values (e.g. `"rule-1"`, `"et-1"`, `"test-author"`) instead of UUIDs.
- **Nullable fields in data classes**: model data classes (e.g. `EventTypeModel.description`) have no default values. Always pass all arguments explicitly — use `null` for nullable fields you don't need.
- **PATCH requests**: use `rest.exchange(url, HttpMethod.PATCH, HttpEntity(body, headers), ResponseType::class.java)` — `TestRestTemplate` has no `patchForEntity`.
- **List responses**: use `rest.exchange(..., object : ParameterizedTypeReference<List<T>>() {})` instead of `getForEntity`.
- **Public vs auth endpoints**: booking routes (`/book/{slug}`) need no `x-user-id` header. All other endpoints require it.
- **Lint after every test change**: after modifying any test file, run `make backend-lint` (or `./gradlew ktlintCheck`) to catch ktlint violations in tests. The `ktlintTestSourceSetCheck` task enforces formatting on test sources.

### Typical local dev flow

Two terminals: an API server on :4010 — either `make mock` (Prism, spec-only) or `make backend-run` (the real Spring Boot backend) — and `npm run dev` in `frontend/` (serves the UI, proxies nothing — it calls `localhost:4010` directly via absolute URL). `make dev` runs `mock` + `frontend-dev` together; swap in `backend-run` manually if you want the real backend instead of the mock.

## Architecture

### API spec (`main.tsp`)

Single TypeSpec file defining the whole Cal Fork domain. Key shape to know before changing routes or models:

- **Auth**: every author-facing endpoint spreads `...AuthorizedRequest`, which requires an `x-user-id` header — there's no real auth, just a user-id header used as an identity stand-in.
- **Resources**: `EventTypes` (meeting templates an author creates), `Slots` (bookable time windows scoped under an event type), `Availability` (recurring weekly availability rules), `Calendar` (author's view of booked meetings in a date range), and `BookingRouter` (the public, unauthenticated booker-facing routes under `/book/{slug}`).
- All operations return `T | Error`, with `Error` marked `@error` (code + message).
- Routes/tags map 1:1 to the interfaces above (`/event-types`, `/event-types/{eventTypeId}/slots`, `/availability`, `/calendar`, `/book/{slug}`).

When adding/changing a model or route, edit `main.tsp` and run `make generate` to regenerate `tsp-output/schema/openapi.yaml` (gitignored, must be regenerated locally — not committed). The backend and frontend are both hand-maintained against this spec — there's no codegen wiring, so a route/model change means updating `main.tsp`, the matching backend controller/service/model, and the frontend `api/` types by hand, in all three places.

### Backend (`backend/src/main/kotlin/com/calfork/`)

Layered per resource, no JPA: `controller/` (Spring MVC, one `@RestController` per spec interface) → `service/` (business logic, authorization checks) → `repository/` (`JdbcTemplate`/`NamedParameterJdbcTemplate`, one per table). `model/` holds plain data classes that double as both the domain model and the JSON response body (e.g. `EventTypeModel`); `dto/Dtos.kt` holds request/error shapes.

- **Auth**: no filter/interceptor — each controller method takes `@RequestHeader("x-user-id") userId: String` directly and services scope queries/ownership checks to it.
- **Errors**: `exception/GlobalExceptionHandler.kt` is a `@ControllerAdvice` mapping `NotFoundException` → 404, `ConflictException` → 409, missing header → 400, else → 500, all as `ErrorDto(code, message)` — mirrors the spec's `T | Error` shape.
- **CORS**: `config/WebConfig.kt` allows the origin(s) in `calfork.cors.allowed-origins` (`application.yml`, defaults to the Vite dev server at `:5173`).
- **Slots are computed, not stored** (see `docs/adr/0001-computed-slots.md`): `SlotService` derives availability by intersecting `AvailabilityRule` with the `EventType`'s duration, minus existing `Booking`s — there's no slots table.
- **No booking reservation** (see `docs/adr/0002-no-slot-reservation.md`): booking is a stateless first-come-first-served `POST`; overlap is enforced at booking time, not slot-list time.
- **Liquibase**: changelogs in `db/changelog/`, chained via `db.changelog-master.yaml`; add a new numbered file + `<include>` rather than editing an applied changelog.

### Frontend (`frontend/src/`)

- **`api/`** is split three ways: `types.ts` hand-mirrors the TypeSpec models (`EventType`, `Slot`, `AvailabilityRule`, `Booking`, etc.); `http.ts` has the low-level `request()`/`ApiError` fetch wrapper, reads `x-user-id` from `localStorage`, and hardcodes `BASE_URL = 'http://localhost:4010'`; `client.ts` exposes the grouped clients (`eventTypesApi`, `slotsApi`, `availabilityApi`, `calendarApi`, `bookingApi`) built on top of `http.ts`'s `api` object.
- **Auth is fake and local**: `context/AuthContext.tsx` stores a plain `userId` string in `localStorage` under `x-user-id`; `api/http.ts` reads that same key to set the header on every request. `components/AuthGuard.tsx` redirects to `/` if no `userId` is set. There's no login flow beyond typing an arbitrary user ID (see the modal in `components/Layout.tsx`).
- **Routing** (`App.tsx`): author-facing pages (`/event-types`, `/event-types/:eventTypeId/slots`, `/availability`, `/calendar`) are wrapped in `AuthGuard`; the public booking page (`/book/:slug`) is not, matching the spec's public `BookingRouter`.
- **UI kit**: Mantine (`@mantine/core`, `dates`, `form`, `hooks`, `notifications`), theme customization in `theme.ts`. Forms use `@mantine/form`; async errors typically surface via `@mantine/notifications`.
- Pages under `pages/` correspond to the spec's interfaces (one page per resource); reusable form pieces live in `components/` (`EventTypeForm`, `AvailabilityForm`).

## Agent skills

### Issue tracker

GitHub Issues on `foundate33/cal-fork-spec`. See `docs/agents/issue-tracker.md`.

### Triage labels

Standard five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single context — `CONTEXT.md` at repo root, ADRs in `docs/adr/`. See `docs/agents/domain.md`.

## Verification

После завершения любой работы напиши, как ты верифицировал изменения — какие команды запускал, какой результат, были ли ошибки. Это должно быть последним шагом перед ответом пользователю.
