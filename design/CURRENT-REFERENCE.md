# Current frontend reference

The current UI uses the Common Language / Novule HTML supplied on 7 November 2026. The approved Retrace vector logo was preserved without regeneration.

- Original input: `design/source-reference/new-reference.html`.
- Extracted source styles: `novule-1.css`, `novule-2.css`, `novule-6.css`, `novule-10.css` in the same directory.
- Runtime source styles: `src/app/novule-source.css`.
- Retrace adaptation and responsive overrides: `src/app/novule-theme.css`.
- React hero chapters, service passes and folder FAQ: `src/app/page.tsx`.

The source's folder, ticket, type, color and FAQ styling is reused. React replaces the Squarespace DOM-building scripts. Tutor content becomes device history; the sample chapter control is local only. No Squarespace scripts, analytics or newsletter submissions run in the application. Existing wallet and passport pages keep their functional behavior and receive the shared visual theme.

Production build passed. No real wallet actions were performed. Backend files remain owned by Claude.
