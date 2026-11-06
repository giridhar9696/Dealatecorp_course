# Dealatecorp design system

Dealatecorp’s course site and admin share one palette and set of controls. [IBM’s DESIGN.md](https://github.com/voltagent/awesome-design-md/blob/main/design-md/ibm/DESIGN.md) informed the semantic roles, square control geometry, ruled lists and flat surface hierarchy. Hallmark’s Sport material supplied the large duration figures and two weights of rule. Taste’s service deal supplied the photo stage and Schibsted Grotesk.

## Colours

| Token | Value | Role |
| --- | --- | --- |
| `--color-accent` | `#20309A` | Royal Blue for headings, primary actions, selection, focus and the hero panel. |
| `--color-paper` | `#FFFFFF` | Pure White for the main canvas, fields and text on blue. |
| `--color-ink` | `#373737` | Mineral Grey for reading text and the footer link band. |
| `--color-paper-2` | 4% Royal Blue mixed into Pure White | Alternating sections and table surfaces. |
| `--color-rule` | 22% Mineral Grey mixed into Pure White | Grid and row separators. |
| `--color-rule-2` | 55% Mineral Grey mixed into Pure White | Form boundaries and stronger rules. |

The hero and footer photos use grayscale. Course and student photos reveal their original colour on hover or keyboard focus. On touch devices the selected course and the student portraits show in colour. The official logos retain their original colours.

## Type and space

- Schibsted Grotesk with a system sans fallback. Use the same face for display, controls and body.
- Hero display scales from 42 to 78 pixels. Section headings scale from 32 to 58 pixels. Body copy is at least 16 pixels and supporting labels are at least 13 pixels.
- Sentence case, compact heading leading, and plain descriptions. Use tabular figures for duration and application references.
- Use a centred container, equal side gutters and 8, 12, 16, 24, 40, 64 and 96 pixel spacing steps. Content grows vertically where it needs room.

## Components

- Primary controls use royal blue fill and white text. Secondary controls use an outline. Both use a 12-pixel radius and a circular fill that starts where the pointer enters or the user presses.
- The sticky navigation draws an underline on desktop hover and keyboard focus. It marks the current section and opens a full-height link list on mobile.
- The course benefits use three white cells with thin rules and Royal Blue labels. They stack on narrow screens. Course photos form a grid beside a shared comparison panel. Hover or focus previews both tracks. Selecting a card commits the course and brings the panel into view on mobile.
- The hero's primary action scrolls to the footer’s photographic application area. A solid white panel keeps the CTA legible at every crop. The links and company information sit in a Mineral Grey band below.
- The bottom-right avatar opens a local internship guide. Suggested questions and typed questions use the same course, duration and application information.
- Apply now opens a labelled native dialog, preselects a course and duration when provided, and shows validation and the receipt inline. Fields have visible labels and focus rings.
- The student showcase adapts the horizontal feature reference into a scroll-snap rail with numbered profiles, portrait frames and keyboard controls. The experience and college details sit beside the photo, stacking on narrow screens. College logos, student portraits and certificates remain editable in the admin.
- Email HR opens a labelled contact dialog with name, email and message fields. Delivery status appears inside the form and a direct email link is available there.

## Motion

GSAP uses short eased transforms and opacity changes for the mobile menu, course descriptions and student profiles. Native scrolling powers the section links and profile rail. Reduced motion shows content without decorative movement, and standard links remain available with scripting off.

## Exports

`public/tokens.css` is the implementation source for colour, typography, spacing and motion.
