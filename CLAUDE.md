# MarqIt

## Repository Details
- AWS account profile: N/A (Supabase project — no AWS dependency; grind AWS credential steps do not apply)
- Project Ticket Location: TireTrack MI
- Deploy Monitoring: N/A (EAS, no CI deploy workflow yet — see MI-26)
- Local Testing notes: `npx expo start`; press `i` for iOS simulator / `a` for Android. Supabase URL + anon key live in `.env` as `EXPO_PUBLIC_*` vars.
  - **Automated UI testing (Maestro MCP):** the app is a managed Expo project (no `ios/`/`android/` committed). To drive it on an iOS simulator: (1) ensure an iOS runtime is installed — `xcodebuild -downloadPlatform iOS` if `xcrun simctl list runtimes` is empty; (2) boot a sim (`xcrun simctl boot "iPhone 17 Pro"`, then `open -a Simulator`); (3) build & install with `npx expo run:ios` — this prebuilds, runs `pod install`, compiles, installs, and starts Metro (leave it running). The app's `appId` is `com.jlippincott.marq-it`. Then use the Maestro MCP: `list_devices` → `inspect_screen` → `run`. iOS has no hardware back — tap the header back button (`id: "BackButton"`), not Maestro's `- back`. A passing Home→Charting→Settings smoke flow exists in the MI-7 work.

A mobile app (iOS + Android) that serves as a charting tool for families using the **Marquette Method** of natural family planning.

## What the app does

A married couple shares a single **household** account. Each spouse logs the day's fertility observation and records intercourse. The app charts these per day according to a selected **protocol**. The first protocol being built is **Nursing Mother (the "10-day" protocol)**.

## Tech stack

- **Mobile:** Expo (React Native + TypeScript), single codebase for iOS + Android. Builds/releases via EAS.
- **Backend:** Supabase (Postgres, Auth, Row-Level Security, Realtime). Free tier is sufficient for the initial <10 users and scales to paid tiers.
- **Important:** Do **not** use Tire Rack / work AWS accounts or resources. This is a personal project on independent infrastructure.

## Core domain model

- **Household** — owns all charting data. Created at sign-up.
- **Members** — exactly **two** per household (husband and wife). Each has their **own** login (email/username + password) but both authenticate into the same household.
- **Day entry** — one Low/High/Peak reading per charting day, shared across both spouses.
- **Intercourse events** — many per day.
- **Settings** — per household: the daily **reset time** and the selected **protocol**.

### Key business rules (do not break these)

1. **One reading per day, shared between spouses.** Low / High / Peak can be recorded **exactly once per charting day across BOTH spouses combined.** Once either spouse taps one of the three, all three lock for both users until the next reset time.
2. **Intercourse is unrestricted.** The Intercourse button is always available and can be pressed multiple times per day.
3. **The "day" is defined by the reset time.** A couple-configurable time (e.g., 4:00 AM) marks when one charting day ends and the next begins. The once-per-day lock is scoped to this boundary, not calendar midnight.
4. **Protocol drives the Charting page.** Three protocols exist — "Nursing Mother", "Transition to Period", "Regular Cycle" — but only **Nursing Mother (10-day)** is implemented for now. The others are selectable but stubbed/disabled.

## App structure (screens)

- **Auth** — if unauthenticated, the user signs in or creates an account (which creates the household and captures both spouses' names + the first login).
- **Home** — simple navigation plus four prominent buttons: **Low**, **High**, **Peak**, **Intercourse**.
- **Settings** — set the reset time and select the protocol.
- **Charting** — the per-protocol view. For Nursing Mother: a vertical column of day cards (one per day) with a small calendar header. Opens centered on the current day, scrolls up/down. Each card shows the day's reading and a counter of intercourse presses. Entries are editable here.

## Privacy

This app stores sensitive reproductive-health data for a small number of users. Treat data protection as a first-class concern: enforce Supabase Row-Level Security so a member can only ever access their own household's data, store auth tokens securely (expo-secure-store), and never log or expose chart data.

## Project management

Work is tracked in **TireTrack**, project **MarqIt** (key `MI`). Epics MI-1–MI-6 group the stories MI-7–MI-26. Each ticket carries an "Open Considerations" section to be fleshed out before implementation.

## Status

App shell scaffolded (MI-7 complete): Expo Router (file-based, typed routes), NativeWind styling, placeholder screens for Auth/Home/Settings/Charting behind a stubbed auth gate, ESLint/Prettier, and Jest + @testing-library/react-native. No backend yet — Supabase client/env is MI-8, schema MI-9, RLS MI-10. See `README.md` for dev commands and folder layout.
