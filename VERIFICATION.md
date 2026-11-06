# Dealatecorp implementation and verification

## Navigation, course benefits and HR contact

- Taste’s service layout guided the equal gutters, three ruled benefit cells and the photographic footer. The CTA uses a solid white panel to preserve contrast. Design.md applies the existing IBM-inspired surface and rule roles with the Dealatecorp palette. The footer uses the project’s previously licensed training photo in two sizes. [Unsplash license](https://unsplash.com/license)
- The cinematic motion skill guided the short eased GSAP stagger on the mobile menu. Desktop navigation marks the current section and draws an underline on hover or keyboard focus. Scrolling uses the browser’s native section links.
- The ten supplied portraits retain their original colours on hover and keyboard focus, with colour available on touch. Each profile shows the approved experience from the admin when available and otherwise shows the known internship context.
- Playwright passed seven viewport sizes. It covered the menu, course benefits and comparisons, student portrait reveal and experience content, footer CTA and application modal, and admin workflows. The HR contact test mocked EmailJS failure and success and verified validation, payload fields, draft preservation and focus return. The server test passed.
- The EmailJS dashboard controls the template recipient. The code uses the supplied public identifiers, and the README records the expected recipient, reply field and origin settings. Live inbox delivery was outside the local test. [EmailJS template setup](https://www.emailjs.com/docs/tutorial/creating-email-template/)
- Taste's performance audit reported zero failures and zero broken requests. Its three warnings concern the sticky logo and the sizes of the existing college and sample certificate images. The layout audit still flags content-sized sections and split headings against the kit's fixed-height and grid rules. The hero fills the first screen at the tested sizes.
- The quick consistency run still flags the kit's fixed section heights, the padding inside the new benefits cells, offscreen lazy portraits in the horizontal showcase and content passing behind the fixed chat launcher while scrolling on a phone. Playwright verified the hero buttons clear the launcher and the portraits load when selected. The consistency run skipped form submissions, which Playwright checked with a mock provider.

## Internship landing update

- Taste selected the photo-led film layout for the hero. The primary CTA takes visitors to the footer, where Apply now opens the existing six-field application dialog. The mobile hero uses a smaller photo crop and keeps the CTA in the first screen.
- The cinematic motion skill guided the eased GSAP course and envelope transitions. The eight locally served WebP photos reveal their original colour on hover or keyboard focus. Touch selection reveals the selected photo, and reduced-motion settings suppress the movement. [Unsplash license](https://unsplash.com/license)
- The attached string-tie component informed the footer disclosure, cord animation and draggable loose end. The footer retains the company logo, contact links and quick links to the public sections.
- The avatar opens an automated guide covering courses, duration and applications. The course list comes from the current catalogue, and the guide links to the application and HR email.
- Playwright passed the hero-to-application route, envelope drag, chat suggestions and typed questions, focus return, eight course comparisons and five admin workflows. The suite checked seven viewport sizes. Desktop and mobile screenshots were reviewed, and the server test passed.
- Mobile emulation verified the smaller hero photo, tap-to-reveal course photos, the chat’s course list and application link, and the footer link targets.
- Taste reported zero performance failures and zero broken requests. The three warnings concern the sticky logo and the college and sample certificate image sizes. The layout audit still flags content-sized sections against the kit’s fixed section heights. The hero filled the tested first screens, including the longer headline stress test.

## Illustrated courses, student showcase and application dialog

- Adapted the Horizontal Feature Reveal reference into a numbered horizontal showcase with swipe, arrow buttons and keyboard navigation. Cropped the ten supplied announcement posters into 480 × 480 portraits and used a consistent grayscale treatment. Profile names and departments come from the posters. Approved quotes, experiences and skills can be added through the admin.
- Used the Origin Button reference for pointer-origin fills, centered keyboard activation and press feedback. Adapted both component references to the existing server-rendered HTML, CSS and JavaScript.
- Applied the cinematic motion skill to the eight course illustrations and profile transitions using local GSAP core, short eased transforms and staggered text. The course descriptions remain available on keyboard focus, touch and with reduced motion.
- Added a native application dialog that prefills the selected course and duration. The form requires all six fields, posts to the existing SQLite workflow and displays the receipt in place. The original form URL remains available as a fallback when JavaScript is disabled.
- Added the supplied college logo and Dealatecorp’s official mark in their original colours. [GMRIT logo](https://gmritdu.edu.in/img/logo-gmrit.png) · [Dealatecorp website](https://www.dealatecorp.in/)
- Playwright exercised seven viewport sizes, eight course-image previews, modal submission and validation, focus return, ten profiles, certificate previews, and the five admin content workflows. The backend test exercised required-phone validation for JSON and the same application receipt across form and modal retries.

## Design skills

| Skill | How it shaped the result |
| --- | --- |
| Awesome DESIGN.md | Used the IBM reference for semantic colour roles, square controls, ruled tables and flat layers. Translated those decisions into `DESIGN.md` and the shared tokens used by the public site, form and admin. [IBM design reference](https://github.com/voltagent/awesome-design-md/blob/main/design-md/ibm/DESIGN.md) |
| Hallmark | Reviewed the editorial deal, chose Sport for its duration figures and two rule weights, and used the Stage, masthead and colophon draw. The exact Dealatecorp palette and Taste’s typography replaced the theme’s volt accent and condensed capitals. The screenshot review led to readable filled buttons, a two-line headline and a shorter introduction. |
| Taste | Classified the site as a service. Used the dealt photo hero, Schibsted Grotesk, equal outer gutters, flat surfaces and restrained hover and press feedback. The layout and performance review led to a separate mobile image, a sharper tablet source, and room for both duration labels at 320 pixels. |
| Playwright CLI | Exercised the public site and admin with an isolated database and synthetic data. Captured and inspected desktop, tablet and mobile screenshots. |

The public page uses the six requested groups in order. The hero and company introduction form the first group. The admin shares the exact three colours and uses the same controls, form fields, rules and type.

## What was verified

- Playwright CLI passed at 1440, 1280, 1024, 820, 768, 390 and 320 pixels. The suite covered mouse and keyboard course selection, mobile navigation, all eight course comparisons, both duration-specific links, client and server validation, submission, certificate preview and focus return.
- The admin test covered failed sign-in, successful sign-in, status changes, filtering, sign-out, and create, edit and remove operations for courses, colleges, testimonials, certificates and the hero image. Uploaded replacements were checked byte for byte and the edited content was checked on the public page.
- With JavaScript disabled, course links still loaded both descriptions and certificate links opened the image directly.
- `npm test` passed. It checked same-origin POST protection, protected admin pages, duplicate submission handling, output escaping, invalid upload rejection, SQLite persistence and notification retries across server restart with a simulated provider.
- Hallmark’s rendered checks finished with zero failures. The record waives the off-white preference for the required Pure White and the fixed spacing scale for the responsive hero crop. Its static colour heuristic compares white button ink with the white canvas, while rendered contrast checks confirm the button’s blue fill.
- Taste’s final performance audit reported zero failures and zero broken requests. Its consistency and layout audits did not pass the kit’s exact screen-height and grid rules. Sections grow to fit content, the hero uses an overlapping solid panel, and placeholder slots and live course comparison serve sections where the checker expects photographic feature layouts. The prescribed footer order leaves the final certificate section as a gallery. The raw logs in `shots/taste` show the findings.
- The official website returned HTTP 200. The company profile supplied the published locations and the internship cohort reference. [Official website](https://www.dealatecorp.in/) · [Dealatecorp company profile](https://www.linkedin.com/company/dealatecorp/)

## Assets and launch inputs

| Slot | Included | Replacement |
| --- | --- | --- |
| Hero | Monochrome Unsplash photo in desktop and mobile sizes, plus the official Dealatecorp mark | An approved training photo around 2000 × 1333 in **Hero image**, with alt text. |
| Colleges | GMR Institute of Technology internship cohort with the official college logo | Approved names and logos in **Colleges**. A transparent 320 × 200 PNG works well. |
| Testimonials | Ten GMRIT student profiles with portraits and department details | Approved quotes, experiences and skills in **Testimonials**. A 400 × 440 portrait or larger works well for new profiles. |
| Certificates | Two labelled 720 × 500 sample images | Redacted or approved landscape certificate images in **Certificates**. |
| Course descriptions | Editable starter syllabus copy for each duration | Approved descriptions in **Courses**. |

Local testing used Chrome. Public deployment and real email delivery require a production origin, admin password and Resend credentials. The delivery path was tested with a simulated provider.

