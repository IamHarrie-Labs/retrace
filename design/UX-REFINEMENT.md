# UX refinement

Removed decorative eyebrow subtitles across application page headings, the footer slogan and the repeated marketing labels above the CTA. Replaced the exploded laptop artwork with two original generated MacBook photographs in `public/images/macbook-studio.png` and `macbook-service.png`. The sample page uses the same new studio photograph.

The new `src/app/ux-polish.css` gives the hero a predictable two-column layout, uses consistent left alignment and paragraph widths, straightens the service panels, aligns their actions, simplifies the FAQ and removes exaggerated shadows and decorative ticket barcodes. The approved vector logo is unchanged. The earlier reference styling remains the base; this layer resolves its competing rules.

Production build and frontend lint passed. Desktop and 375px phone layouts were inspected; no horizontal overflow or broken images were observed on the landing page. FAQ interaction was checked. Generated images are illustrative and are not photographs of a registered user device. Backend behavior was not changed.
