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

## Project management

Work is tracked in TireTrack under project **MarqIt** (`MI`). See [`CLAUDE.md`](./CLAUDE.md) for the working spec.

## Status

Pre-implementation — the Expo app has not been scaffolded yet.
