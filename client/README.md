# Client Routing Notes

## Page ownership and routing conventions

- The app uses **route-driven navigation with `wouter`** as the canonical model.
- `client/src/App.tsx` is the single source of truth for all top-level routes.
- `client/src/pages/Dashboard.tsx` is the canonical dashboard screen implementation.
- `client/src/pages/home/*` now contains legacy feature widgets only; it should not host an alternate app shell or route controller.
- When adding or changing sidebar links in `client/src/components/layout/Sidebar.tsx`, always add or update the corresponding route in `client/src/App.tsx` in the same change.
- For sections that are not fully implemented yet, use a lightweight route page (for example via `GenericInfoPage`) so links never lead to 404s.
