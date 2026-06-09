# MarqIt

A mobile app (iOS + Android) that serves as a charting tool for families using the **Marquette Method** of natural family planning.

A married couple shares a single **household** account. Each spouse logs the day's fertility observation (Low / High / Peak) and records intercourse. The app charts these per day according to a selected protocol — the first being **Nursing Mother (the "10-day" protocol)**.

## Tech stack

- **Mobile:** [Expo](https://expo.dev) (React Native + TypeScript), one codebase for iOS + Android, released via EAS.
- **Backend:** [Supabase](https://supabase.com) — Postgres, Auth, Row-Level Security, and Realtime.

## Core rules

1. **One reading per day, shared between spouses.** Low / High / Peak can be recorded exactly once per charting day across *both* spouses combined; the first tap locks all three until the next reset.
2. **Intercourse is unrestricted** — recordable any number of times per day.
3. **The "day" is defined by a couple-configurable reset time** (e.g., 4:00 AM), not calendar midnight.
4. **The selected protocol drives the Charting page.** Only **Nursing Mother (10-day)** is implemented for now.

## Screens

- **Auth** — sign in, or create an account (creates the household + captures both spouses' names and the first login).
- **Home** — navigation plus four buttons: Low, High, Peak, Intercourse.
- **Settings** — reset time and protocol selection.
- **Charting** — per-protocol view; for Nursing Mother, a scrollable column of day cards with a calendar header.

## Privacy

MarqIt stores sensitive reproductive-health data. Supabase Row-Level Security restricts each member to their own household's data, and auth tokens are kept in secure device storage.

## Development

Requires Node 18+ and the Expo tooling (installed via `npx`).

```bash
npm install        # install dependencies
npm start          # start the Metro dev server (press i / a / w for iOS / Android / web)
npm run ios        # start + open iOS simulator
npm run android    # start + open Android emulator
npm test           # run the Jest test suite
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint (expo lint)
npm run format     # Prettier --write
```

### Stack & conventions

- **Expo Router** (file-based routing) with **typed routes**. Routes live in `src/app/`.
- **NativeWind** (Tailwind) for styling — utility classes via `className`. Tokens in `tailwind.config.js` and `src/constants/theme.ts`.
- **Jest** + **@testing-library/react-native** for tests.
- Path alias: `@/*` → `src/*`.

### Layout

```
src/
  app/                 # Expo Router routes
    _layout.tsx        # root: providers + route groups
    (auth)/            # sign-in / sign-up           (unauthenticated)
    (app)/             # Home / Settings / Charting  (authenticated, gated)
  components/          # reusable UI (Screen, ActionButtons, …)
  hooks/               # shared hooks
  lib/                 # non-UI logic (auth stub today; Supabase client → MI-8)
  constants/           # design tokens / enums
  types/               # shared types
```

The auth gate (`src/lib/auth.ts`) is a **stub** that always reports an authenticated
session, so the shell is navigable today. Real auth arrives in MI-13.

## Project management

Work is tracked in TireTrack under project **MarqIt** (`MI`). See [`CLAUDE.md`](./CLAUDE.md) for the working spec.

## Status

App shell scaffolded (MI-7): Expo Router navigation, NativeWind, placeholder
screens, and tests. No backend yet — Supabase wiring is MI-8.
