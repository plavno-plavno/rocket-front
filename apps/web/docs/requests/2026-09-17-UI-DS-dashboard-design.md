# Dashboard visual refresh (cross-track)

User-authorized redesign after phase one, inspired by MaterialM. This change spans UI-DS (tokens and KPI cards), UI-0 (shell and motion), and UI-F8 (overview). Apply the `cross-track` label if opening a PR; no contract or backend changes.

- Shared light/dark surfaces, pastel KPI cards, sidebar branding, responsive page headers.
- Overview network health derives from the existing scoped listing summary; RU/EN messages.
- GSAP animates only DOM nodes owned by hydrated components. `matchMedia` respects reduced motion and reverts on navigation/unmount. KPI queries use server prefetch and Suspense to prevent a shared badge cache hydration race.
- Verify with the overview and design Playwright specs, typecheck, lint, format, template/dependency and contrast checks.
