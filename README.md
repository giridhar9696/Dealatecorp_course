# Dealatecorp course website

A server-rendered course catalogue, application form and admin dashboard. The site runs on Node.js 24 or newer and SQLite, with no runtime packages to install.

## Run locally

In PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
npm start
```

Set `ADMIN_PASSWORD` to a unique password of at least 16 characters in `.env`. Open [the course site](http://127.0.0.1:3000/) or [the admin sign-in](http://127.0.0.1:3000/admin). Without a password, admin access stays disabled and the public site remains available.

If port 3000 is already in use, set `PORT=3917` in `.env` and open [the alternate local URL](http://127.0.0.1:3917/).

The database is created on first run at `data/dealatecorp.sqlite`. It holds the course catalogue, applications, media, sessions and email queue. Back up the database with SQLite's backup tools or stop the server before copying it. Set `DB_PATH` to keep the database on a persistent volume in deployment.

## Publish and manage content

| Admin view | Actions |
| --- | --- |
| Applications | Read submissions, filter by status and move them through review, acceptance or decline. |
| Courses | Add, edit or remove courses and update both descriptions. Earlier applications retain the course name selected at submission. |
| Colleges | Manage names and collaboration details, and upload or replace logos. |
| Testimonials | Manage the ten imported GMRIT profiles and add photos, departments, internship experiences, skills and approved quotes. |
| Certificates | Upload and replace certificate images for the gallery. |
| Hero image | Replace the training photograph and provide alt text. |

The four image managers accept JPEG, PNG or WebP up to 5 MB. The public site uses the supplied GMRIT logo, ten portraits cropped from the supplied posters, and two labelled sample certificates. Add approved student quotes and experiences in Testimonials. The supplied GMRIT profiles and college logo are added once to each database and remain editable.

The browser uses the locally bundled GSAP core for course and profile reveals. [GSAP standard license](https://gsap.com/standard-license/)

## Email and deployment

Set `RESEND_API_KEY`, `EMAIL_FROM` (a sender at a verified domain) and `EMAIL_TO` (the admissions inbox). The application and both notification jobs are committed together. Once email is configured, the server sends an applicant acknowledgement and an admissions notice. Temporary failures remain queued and retry with the same payload and idempotency key. The dashboard reports pending, submitted and failed jobs. [Resend send-email documentation](https://resend.com/docs/api-reference/emails/send-email)

**Email HR** uses the supplied EmailJS service and template for visitor enquiries. In the EmailJS dashboard, set the template's **To Email** to `hr@dealatecorp.in` as a fixed address and its **Reply-To** to `{{email}}`. The form sends the standard `name`, `email`, `message`, `title` and `time` variables. If the domain allowlist is enabled, add the deployed website origin. The browser tests mock delivery. [EmailJS template setup](https://www.emailjs.com/docs/tutorial/creating-email-template/) · [EmailJS domain allowlist](https://www.emailjs.com/docs/faq/can-i-add-my-domain-to-allowlist/)

For a public deployment, put the server behind an HTTPS reverse proxy, set `PUBLIC_ORIGIN` to the site's HTTPS origin, keep `.env` private, and persist and back up the database. The public origin enables the canonical URL, sitemap and secure session cookies.

## Verify

Run `npm test` for application validation, idempotency, protected admin, upload rejection and database and email-queue persistence. Browser verification uses Playwright CLI against an isolated local database. Start a test instance with `ADMIN_PASSWORD=browser-test-only-2026` and `DB_PATH` pointing to a temporary database, then run:

```text
playwright-cli -s=dealate open http://127.0.0.1:3000/ --browser=chrome
playwright-cli -s=dealate run-code --filename=tests/browser.js
playwright-cli -s=dealate close
```

The browser run submits an application and creates, edits and removes test content. It writes screenshots to `shots/`.

