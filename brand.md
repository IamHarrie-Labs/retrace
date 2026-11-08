# Retrace brand

The identity now follows the user-supplied Peabody House HTML and its referenced stylesheets. The source section structure and component CSS are ported into the existing Next.js application. Product-specific changes live in `src/app/reference-theme.css`.

## Wordmark

Use the outlined lowercase Retrace wordmark as the primary brand. Its restrained sans-serif lettering ends with an ochre square. The former R-and-arrow monogram is retired. The secondary trace symbol connects two points along a stepped path and is used for the favicon and compact placements.

`public/brand/retrace-logo.svg` contains outlined glyphs and has no font dependency. `Brand` renders the same vector in navigation and the footer. `public/brand/retrace-mark.svg` supplies `BrandMark`. `scripts/outline-logo.py` regenerates both using the locally licensed Geist font.

## Palette

| Role | Color |
| --- | --- |
| Paper | #FAF6F3 |
| Ink | #26211E |
| Ochre | #DC942F |
| Sea glass | #71C7B7 |
| Cobalt | #517BB3 |
| Cranberry | #A24250 |
| Olive | #455330 |

The source’s warm paper and ink lead. Color marks different repair chapters and illustration states. Keep text in ink or paper with appropriate contrast; accent diagrams are decorative.

## Typography and layout

Instrument Serif supplies the expressive display voice. Geist supplies body text, controls and secondary headings. Geist Mono is reserved for identifiers and small technical labels. All fonts are bundled with licenses. The original source’s proprietary fonts are not shipped.

Preserve the source’s 18-column grid, two-thirds/one-third hero, 2px ruled boundaries, sticky section titles, two-column illustrated service grid, featured-case placement, evidence table and asymmetric expanding tiles. Source CSS is isolated under `.source-page` and component scopes.

## Tone and motion

Use direct product language: repair records, outcomes, suggested checks and passport holders. Label examples clearly. Roles and evidence are declared; storage does not prove a fix worked. App access and operator visibility stay explicit.

The laptop contour field responds to pointer movement. Palette buttons change its ink. Expanding tiles lead to working product routes. Respect reduced-motion and the footer pause control. Avoid decorative motion that blocks reading or navigation.
