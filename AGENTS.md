# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This repo has two independent parts:

- **Root** — a TypeSpec API specification for "Cal Fork" (a Calendly-like scheduling app), compiled to OpenAPI 3.1.
- **`frontend/`** — a React + Vite + Mantine UI that consumes that API. It has its own `package.json`, `node_modules`, and toolchain, entirely separate from the root.

There is no backend implementation in this repo — the API is mocked via Prism from the generated OpenAPI spec.

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

The Prism mock server listens on `http://localhost:4010` (the frontend's `API` base URL — see `frontend/src/api/client.ts`), and needs to be running for the frontend to work against real responses.

`main.tsp` is the single spec source file; there's no split into multiple TypeSpec files. `tspconfig.yaml` configures the OpenAPI3 emitter to output 3.1.0 to `tsp-output/schema/openapi.yaml`.

### Frontend

The `Makefile` also wraps the frontend's npm scripts (each just `cd`s into `frontend/`), so the whole stack can be driven from the root without switching directories:

```
make frontend-install   # npm install
make frontend-dev       # vite dev server
make frontend-build     # tsc -b && vite build
make frontend-lint      # oxlint
make frontend-preview   # vite preview
make frontend-clean     # rm -rf frontend/dist
```

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

There are no tests configured in either part of the repo.

### Typical local dev flow

Two terminals: `make mock` at the repo root (serves the API on :4010), and `npm run dev` in `frontend/` (serves the UI, proxies nothing — it calls `localhost:4010` directly via absolute URL). Or run both at once with `make dev` from the root.

## Architecture

### API spec (`main.tsp`)

Single TypeSpec file defining the whole Cal Fork domain. Key shape to know before changing routes or models:

- **Auth**: every author-facing endpoint spreads `...AuthorizedRequest`, which requires an `x-user-id` header — there's no real auth, just a user-id header used as an identity stand-in.
- **Resources**: `EventTypes` (meeting templates an author creates), `Slots` (bookable time windows scoped under an event type), `Availability` (recurring weekly availability rules), `Calendar` (author's view of booked meetings in a date range), and `BookingRouter` (the public, unauthenticated booker-facing routes under `/book/{slug}`).
- All operations return `T | Error`, with `Error` marked `@error` (code + message).
- Routes/tags map 1:1 to the interfaces above (`/event-types`, `/event-types/{eventTypeId}/slots`, `/availability`, `/calendar`, `/book/{slug}`).

When adding/changing a model or route, edit `main.tsp` and run `make generate` to regenerate `tsp-output/schema/openapi.yaml` (gitignored, must be regenerated locally — not committed).

### Frontend (`frontend/src/`)

- **`api/client.ts`** is the single source of truth for API types and calls — it hand-mirrors the TypeSpec models (`EventType`, `Slot`, `AvailabilityRule`, `Booking`, etc.) and exposes grouped clients (`eventTypesApi`, `slotsApi`, `availabilityApi`, `calendarApi`, `bookingApi`) wrapping a shared `request()` helper. `BASE_URL` is hardcoded to `http://localhost:4010`. When `main.tsp` changes, update the matching types/calls here by hand (there's no codegen wiring between the spec and the frontend).
- **Auth is fake and local**: `context/AuthContext.tsx` stores a plain `userId` string in `localStorage` under `x-user-id`; `api/client.ts` reads that same key to set the `x-user-id` header on every request. `components/AuthGuard.tsx` redirects to `/` if no `userId` is set. There's no login flow beyond typing an arbitrary user ID (see the modal in `components/Layout.tsx`).
- **Routing** (`App.tsx`): author-facing pages (`/event-types`, `/event-types/:eventTypeId/slots`, `/availability`, `/calendar`) are wrapped in `AuthGuard`; the public booking page (`/book/:slug`) is not, matching the spec's public `BookingRouter`.
- **UI kit**: Mantine (`@mantine/core`, `dates`, `form`, `hooks`, `notifications`), theme customization in `theme.ts`. Forms use `@mantine/form`; async errors typically surface via `@mantine/notifications`.
- Pages under `pages/` correspond to the spec's interfaces (one page per resource); reusable form pieces live in `components/` (`EventTypeForm`, `SlotForm`, `AvailabilityForm`).
