import { additionalProfiles, contentTypes, courses as originalCourses, partnerColleges, statuses, tracks } from './catalog.mjs';

export const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

const icon = (path, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" ${extra}><path d="${path}"/></svg>`;
const arrow = icon('M3 12h17m-7-7 7 7-7 7');
const menu = icon('M3 6h18M3 12h18M3 18h18');
const close = icon('m5 5 14 14M19 5 5 19');
const hrEmail = 'hr@dealatecorp.in';
const emailHR = `<a href="mailto:${hrEmail}" data-email-hr>Email HR</a>`;
const wordmark = (lazy = false) => `<a class="wordmark" href="/"><img src="/assets/dealatecorp.png" width="30" height="30" alt=""${lazy ? ' loading="lazy"' : ''}><span>Dealatecorp</span></a>`;
const links = [['about', 'About'], ['courses', 'Courses'], ['colleges', 'Colleges'], ['testimonials', 'Testimonials'], ['certificates', 'Certificates']];
const navLinks = links.map(([id, label]) => `<a href="/#${id}">${label}</a>`).join('');
const cta = (href, label, options = {}) => `<a class="btn btn--${options.secondary ? 'secondary' : 'primary'}" href="${href}"${options.label ? ` aria-label="${esc(options.label)}"` : ''}>${label}${arrow}</a>`;

function layout({ title, description = '', privatePage = false, canonical = '', header = '', body, motion = false }) {
  return `<!doctype html>
<html lang="en" data-type="service" data-radius="sharp" data-buttons="solid">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="page-type" content="service">
<meta name="site-kind" content="other">
<meta name="theme-color" content="#20309A">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website">` : ''}
${privatePage ? '<meta name="robots" content="noindex, nofollow">' : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<link rel="icon" href="/assets/dealatecorp.png" type="image/png">
<link rel="stylesheet" href="/style.css">
${motion ? '<script src="/assets/gsap.min.js" defer></script>' : ''}
<script src="/site.js" defer></script>
</head>
<body id="top">
<!-- Taste service deal: photo-led film frame, Schibsted Grotesk, masthead, flat sections. -->
<header class="nav"><div class="wrap nav__bar">
<a class="skip" href="#main">Skip to content</a>
${wordmark()}${header}</div></header>
${body}
</body></html>`;
}

const publicHeader = `<nav class="nav__links nav__desktop" aria-label="Main">${navLinks}</nav>
<details class="mobile-nav"><summary aria-label="Menu">${menu}${close}</summary><nav class="nav__links" aria-label="Mobile">${navLinks}<a href="/apply">Apply now ${arrow}</a></nav></details>
${cta('/apply', 'Apply now')}`;

function hero(photo) {
  return `<section class="hero hero--film" aria-labelledby="hero-title">
    <div class="wrap hero__stage">
      <div class="hero__frame">
        <figure class="hero__visual" data-slot="hero">
          <picture>
            ${photo?.hasImage ? '' : '<source media="(max-width: 600px)" srcset="/assets/internship-hero-mobile.webp" width="600" height="630">'}
            <img src="${photo?.hasImage ? media(photo) : '/assets/internship-hero.webp'}" width="1440" height="960" data-source="${photo?.hasImage ? 'client' : 'library'}" data-subject="project learning" alt="${esc(photo?.name || 'A group working together around a table with laptops')}" fetchpriority="high">
          </picture>
        </figure>
        <div class="hero__text">
          <h1 id="hero-title">Tech internships for students</h1>
          <p class="hero__lead">Build practical skills in programming, AI, cloud computing and Salesforce in a 45‑day or 3‑month internship.</p>
          <div class="btn-row">${cta('#internship', 'Apply for an internship')}${cta('#courses', 'Compare courses', { secondary: true })}</div>
        </div>
      </div>
    </div>
  </section>`;
}

export function home(data, selectedId, origin, requestId) {
  return layout({
    title: 'Tech internships for students | Dealatecorp',
    description: 'Compare 45-day and 3-month Dealatecorp technology courses in programming, full stack development, AI, cloud computing and Salesforce. Apply online.',
    canonical: origin ? `${origin}/` : '',
    motion: true,
    header: publicHeader,
    body: `<main id="main">${hero(data.hero[0])}${about()}${catalogue(data.courses, selectedId)}${collegesSection(data.colleges)}${testimonialsSection(data.testimonials)}${certificatesSection(data.certificates)}</main>${footer(data.courses.length)}${internshipChat(data.courses)}${contactDialog()}${data.courses.length ? applicationDialog(data.courses, requestId) : ''}`,
  });
}


const collegeIcon = icon('m2 8 10-5 10 5v2H2V8Zm2 12h16M6 11v6m4-6v6m4-6v6m4-6v6');
const portraitIcon = icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-2c0-2.8 3.6-5 8-5s8 2.2 8 5v2');
const zoom = icon('M20 20l-4-4m1-5a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM8.5 11h5m-2.5-2.5v5');
const media = row => `/media/${row.kind}/${row.id}?v=${row.revision}`;
const collegeImage = college => {
  if (college.localUrl) return college.localUrl;
  if (college.hasImage) return media(college);
  const logo = partnerColleges.find(([id]) => id === college.id);
  return logo ? (logo[3] ? `/assets/${logo[2]}` : logo[2]) : media(college);
};
const canonicalCollegeName = college => partnerColleges.find(([id]) => id === college.id)?.[1] || college.name;
const applyURL = (id, track) => `/apply?course=${encodeURIComponent(id)}&amp;track=${track}`;

function about() {
  return `<section class="section about" id="about" aria-labelledby="about-title"><div class="wrap about__layout">
    <div><h2 id="about-title">About us</h2>
    <p class="lead">Dealatecorp Innovations is an IT services and consulting company based in Visakhapatnam and Hyderabad.</p>
    <p>Students practice software, AI and cloud skills in foundation courses or longer projects.</p></div>
    <div class="about__index" aria-label="Areas of study">
      <span>Programming</span><span>Full stack development</span><span>Artificial intelligence</span><span>Cloud and Salesforce</span>
    </div>
  </div></section>`;
}

function catalogue(courses, selectedId) {
  const active = courses.find(course => course.id === selectedId) || courses[0];
  const courseLogos = { python: 'course-python.webp', java: 'course-java.webp', 'full-stack-python': 'course-full-stack-python.webp', 'full-stack-java': 'course-full-stack-java.webp', 'agentic-ai': 'course-agentic-ai.jpg', 'generative-ai': 'course-generative-ai.webp', cloud: 'course-cloud.webp', salesforce: 'course-salesforce.webp' };
  return `<section class="section courses" id="courses" aria-labelledby="courses-title"><div class="wrap">
    <div class="section-heading"><h2 id="courses-title">Courses we offer</h2><p>Explore a course to compare its Normal and Advanced tracks.</p></div>
    <dl class="course-benefits" aria-label="Course benefits">
      <div><dt>Job-centric</dt><dd>Industry-relevant curriculum</dd></div>
      <div><dt>Practical mini projects</dt><dd>Real-time scenarios</dd></div>
      <div><dt>Career guidance</dt><dd>Placement-oriented support</dd></div>
    </dl>
    ${active ? `<div class="course-compare" id="course-options" data-compare>
      <ul class="course-gallery" aria-label="Course catalogue">${courses.map((course, index) => {
        const mark = { python: 'Py', java: 'Java', 'full-stack-python': 'Py / Web', 'full-stack-java': 'Java / Web', 'agentic-ai': 'AI →', 'generative-ai': 'AI', cloud: '☁', salesforce: 'Salesforce' }[course.id] || course.name;
        return `<li><a href="/?course=${course.id}#course-details" class="course-choice" data-course="${course.id}" aria-controls="course-details"${course.id === active.id ? ' aria-current="true"' : ''}>
          <span class="course-image${courseLogos[course.id] ? ' course-image--logo' : ' course-image--mark'}" aria-hidden="true">${courseLogos[course.id] ? `<img src="/assets/${courseLogos[course.id]}" alt="" width="320" height="180" loading="lazy">` : `<span>${esc(mark)}</span>`}</span>
          <span class="course-caption"><span class="course-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span data-course-label>${esc(course.name)}</span>${arrow}</span>
        </a></li>`;
      }).join('')}</ul>
      <div class="course-details" id="course-details" aria-labelledby="course-detail-title" tabindex="-1">
        <h3 id="course-detail-title" data-course-name>${esc(active.name)}</h3>
        ${Object.entries(tracks).map(([key, track]) => `<article class="track track--${key}" aria-labelledby="track-${key}">
          <div class="track__title"><h4 id="track-${key}">${track.duration}</h4><span>${track.label}</span></div>
          <p class="track__description" data-description="${key}">${esc(active[key])}</p>
          ${cta(applyURL(active.id, key), 'Apply now', { secondary: key === 'normal', label: `Apply now for ${active.name}, ${track.duration}` })}
        </article>`).join('')}
      </div>
      ${courses.map(course => `<template data-course-detail="${course.id}"><span data-name>${esc(course.name)}</span><span data-normal>${esc(course.normal)}</span><span data-advanced>${esc(course.advanced)}</span></template>`).join('')}
    </div><p class="visually-hidden" id="course-status" role="status"></p>` : '<p>Course applications are closed while the next catalogue is being prepared.</p>'}
  </div></section>`;
}

function collegesSection(colleges) {
  return `<section class="section colleges" id="colleges" aria-labelledby="colleges-title"><div class="wrap">
    <div class="section-heading"><h2 id="colleges-title">College collaborations</h2><p>College collaborations supporting Dealatecorp internships.</p></div>
    ${colleges.length ? `<ul class="college-list">${[...colleges, ...partnerColleges.filter(([id]) => !colleges.some(college => college.id === id)).map(([id, name, url, type]) => ({ id, name, detail: '', hasImage: false, revision: 1, kind: 'colleges', localUrl: type ? '/assets/' + url : url }))].map(college => `<li>
      <div class="college-logo"><img src="${collegeImage(college)}" alt="" width="484" height="230" loading="lazy"></div>
      <div><h3>${esc(canonicalCollegeName(college))}</h3>${college.detail ? `<p>${esc(college.detail)}</p>` : ''}</div>
    </li>`).join('')}</ul>` : '<p>College collaborations will appear here when published.</p>'}
  </div></section>`;
}

function testimonialsSection(testimonials) {
  return `<section class="section testimonials" id="testimonials" aria-labelledby="testimonials-title"><div class="wrap">
    <div class="section-heading"><h2 id="testimonials-title">Student testimonials</h2><p>Meet Dealatecorp’s student interns and read their experiences as they’re published.</p></div>
    ${testimonials.length ? `<div class="cohort" data-cohort>
      <div class="cohort__controls" hidden>
        <span data-cohort-status aria-live="polite">1 of ${testimonials.length}</span>
        <button class="icon-btn cohort__prev" type="button" aria-label="Previous student" disabled>${arrow}</button>
        <button class="icon-btn cohort__next" type="button" aria-label="Next student">${arrow}</button>
      </div>
      <ol class="stories" aria-label="Intern profiles" tabindex="0">
        ${testimonials.map((student, index) => `<li class="story">
          <div class="story__portrait${student.id.startsWith('gmrit-') ? ' story__portrait--cohort' : ''}">${student.hasImage ? `<img src="${media(student)}" alt="${esc(student.name)}" width="480" height="480" loading="lazy">` : portraitIcon}</div>
          <div class="story__copy">
            <span class="story__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
            <h3>${esc(student.name)}</h3><p class="story__college">${esc(student.college)}</p>
            ${student.department ? `<p class="story__department">${esc(student.department)} intern</p>` : ''}
            ${student.quote ? `<blockquote><p>${esc(student.quote)}</p></blockquote>` : ''}
            <dl class="story__facts">
              <div><dt>Experience at Dealatecorp</dt><dd>${esc(student.experience || (student.id.startsWith('gmrit-') ? 'Participated in a Dealatecorp internship collaboration.' : 'Internship with Dealatecorp.'))}</dd></div>
              ${student.skills ? `<div><dt>Skills and knowledge gained</dt><dd>${esc(student.skills)}</dd></div>` : ''}
            </dl>
          </div>
        </li>`).join('')}
      </ol>
    </div>` : '<p>No student profiles have been published yet.</p>'}
  </div></section>`;
}

function certificatesSection(certificates) {
  const entries = certificates.length ? certificates : [
    { name: 'Course completion certificate', url: '/assets/dealatecorp-certificate-course.png', sample: true },
    { name: 'Internship completion certificate', url: '/assets/dealatecorp-certificate-internship.png', sample: true },
  ];
  return `<section class="section certificates" id="certificates" aria-labelledby="certificates-title"><div class="wrap">
    <div class="section-heading"><h2 id="certificates-title">Certificates</h2><p>Open a certificate to view it at a larger size.</p></div>
    <div class="gallery">${entries.map(cert => {
      const src = cert.hasImage ? media(cert) : cert.url || '/assets/dealatecorp-certificate-' + (cert.name.toLowerCase().includes('internship') ? 'internship' : 'course') + '.png';
      const sample = cert.sample || !cert.hasImage;
      return `<a class="certificate" href="${src}" data-preview="${esc(cert.name)}" aria-label="Preview ${sample ? 'sample ' : ''}${esc(cert.name)}">
        <span class="certificate__image"><img src="${src}" width="720" height="500" alt="${sample ? 'Sample ' : ''}${esc(cert.name)}" loading="lazy"></span>
        <span class="certificate__label"><span>${esc(cert.name)}</span>${zoom}</span>
      </a>`;
    }).join('')}</div>
    <dialog class="preview" aria-labelledby="preview-title">
      <div class="preview__bar"><h3 id="preview-title">Certificate preview</h3><form method="dialog"><button type="submit" class="icon-btn" aria-label="Close preview">${close}</button></form></div>
      <img alt="" loading="lazy">
    </dialog>
  </div></section>`;
}

function footer(available) {
  return `<footer class="closing" id="contact">
    <div class="footer__stage"><div class="wrap">
      <section class="internship-close" id="internship" aria-labelledby="internship-title">
        <h2 id="internship-title">Internship applications</h2>
        <p>Choose a course and a 45-day or 3-month track, then send your application.</p>
        ${available ? cta('/apply', 'Apply now') : '<p>Applications are currently closed.</p>'}
      </section>
    </div></div><div class="wrap">
    <div class="footer__main"><div>${wordmark(true)}<p>Dealatecorp Innovations Pvt Ltd<br>Technology training, IT services and consulting.</p></div>
      <div><h2>Quick links</h2><ul>${links.map(([id, label]) => `<li><a href="/#${id}">${label}</a></li>`).join('')}</ul></div>
      <div><h2>Contact</h2><ul><li><a href="https://www.linkedin.com/company/dealatecorp/">LinkedIn</a></li><li><a href="https://www.instagram.com/dealatecorp/">Instagram</a></li><li>${emailHR}</li></ul></div>
      <div><h2>Company</h2><ul><li><a href="https://www.dealatecorp.in/">Official website</a></li><li>Visakhapatnam and Hyderabad</li></ul></div>
    </div>
    <div class="footer__legal"><span>© ${new Date().getUTCFullYear()} Dealatecorp Innovations Pvt Ltd</span><a href="/privacy">Privacy</a></div>
  </div></footer>`;
}

function internshipChat(courses) {
  const avatar = `<svg viewBox="0 0 56 56" aria-hidden="true">
    <circle cx="28" cy="28" r="28" fill="var(--color-paper-3)"/>
    <path d="M12 52c1-9 7-14 16-14s15 5 16 14" fill="var(--color-accent)"/>
    <path d="M17 24c0-9 5-14 11-14 8 0 12 6 12 13v7c0 7-5 12-12 12s-12-5-12-12z" fill="var(--color-paper)"/>
    <path d="M16 26v-5c0-8 5-13 13-13 7 0 12 6 12 13v6c-5-1-9-4-12-9-3 5-7 8-13 8z" fill="var(--color-ink)"/>
    <path d="M22 29h1m10 0h1m-9 5c2 2 4 2 6 0" fill="none" stroke="var(--color-ink)" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
  return `<details class="internship-chat" data-chat>
    <summary aria-label="Internship guide">${avatar}<span class="chat__badge" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M2 3h12v8H8l-3 3v-3H2z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.3"/></svg></span></summary>
    <div class="chat__window" aria-labelledby="chat-title">
      <div class="chat__header"><div><h2 id="chat-title">Internship guide</h2><p>Automated answers</p></div><button type="button" class="icon-btn" data-chat-close aria-label="Close internship guide" hidden>${close}</button></div>
      <div class="chat__messages" role="log" aria-label="Conversation"><p>Hi. I can help you choose a course or find the application.</p></div>
      <div class="chat__prompts" hidden>
        <button type="button" class="btn" data-chat-question="apply">How do I apply?</button>
        <button type="button" class="btn" data-chat-question="duration">How long are the tracks?</button>
        <button type="button" class="btn" data-chat-question="courses">Which courses can I take?</button>
      </div>
      <form class="chat__form" hidden>
        <label class="visually-hidden" for="internship-question">Your question</label>
        <input id="internship-question" name="question" maxlength="220" required placeholder="Ask about internships">
        <button type="submit" class="icon-btn" aria-label="Send question">${arrow}</button>
      </form>
      <div class="chat__links"><button type="button" class="btn" data-email-hr>✉ Email HR</button></div>
      <template data-chat-answer="courses">${courses.length ? courses.map(course => esc(course.name)).join(', ') + '.' : 'Courses will appear here when published.'}</template>
      <template data-chat-answer="duration">The Normal track lasts ${tracks.normal.duration.toLowerCase()}. The Advanced track lasts ${tracks.advanced.duration.toLowerCase()}.</template>
      <template data-chat-answer="apply">${courses.length ? 'Open Internship applications, select Apply now, and choose a course and duration.' : 'Internship applications are currently closed. Email HR if you have questions.'}</template>
    </div>
  </details>`;
}

const notice = (message, error = false) => message ? `<p class="notice${error ? ' notice--error' : ''}" role="${error ? 'alert' : 'status'}">${esc(message)}</p>` : '';
const option = (value, name, selected) => `<option value="${esc(value)}"${selected === value ? ' selected' : ''}>${esc(name)}</option>`;
const input = (name, label, values, attributes = 'required') => `<label>${label}<input name="${name}" value="${esc(values[name])}" ${attributes}></label>`;
const submit = label => `<button type="submit" class="btn btn--primary">${label}${arrow}</button>`;
const page = (title, body, header = publicHeader, privatePage = true) => layout({ title: `${title} | Dealatecorp`, privatePage, header, body });

function contactDialog() {
  return `<dialog class="application-dialog contact-dialog" id="contact-dialog" aria-labelledby="contact-title">
    <div class="application-dialog__header">
      <div><h2 id="contact-title">Email Dealatecorp HR</h2><p>Ask about courses, internships or applications.</p></div>
      <form method="dialog"><button type="submit" class="icon-btn" aria-label="Close contact form">${close}</button></form>
    </div>
    <form class="form application-form" method="dialog" data-hr-form>
      ${input('name', 'Your name', {}, 'required maxlength="100" autocomplete="name" autofocus')}
      ${input('email', 'Your email', {}, 'type="email" required maxlength="254" autocomplete="email"')}
      <label>Message<textarea name="message" rows="5" required maxlength="2000"></textarea></label>
      <p class="notice" role="status" data-hr-status hidden></p>
      <div class="application-form__footer">
        <p class="field-note">You can also <a href="mailto:${hrEmail}">use your email app</a>.</p>
        ${submit('Send message')}
      </div>
    </form>
  </dialog>`;
}

function applicationForm(courses, values, message = '') {
  if (!courses.length) return '<p>Course applications are currently closed.</p>';
  return `<form class="form application-form" action="/apply" method="post">
    <p class="notice notice--error" role="alert" data-apply-error${message ? '' : ' hidden'}>${esc(message)}</p>
    <input type="hidden" name="requestId" value="${esc(values.requestId)}">
    <div class="form-grid">
      ${input('name', 'Full name', values, 'required maxlength="120" autocomplete="name"')}
      ${input('email', 'Email address', values, 'type="email" required maxlength="254" autocomplete="email"')}
      ${input('college', 'College or university', values, 'required maxlength="160" autocomplete="organization"')}
      ${input('phone', 'Phone number', values, 'type="tel" required maxlength="30" autocomplete="tel"')}
      <label>Course<select name="course" required>${option('', 'Choose a course', values.course)}${courses.map(c => option(c.id, c.name, values.course)).join('')}</select></label>
      <label>Duration<select name="track" required>${option('', 'Choose a duration', values.track)}${Object.entries(tracks).map(([key, track]) => option(key, `${track.duration} — ${track.label}`, values.track)).join('')}</select></label>
    </div>
    <div class="application-form__footer">
      <p class="field-note">Dealatecorp uses these details to review your application. <a href="/privacy" target="_blank" rel="noopener">Application privacy</a></p>
      ${submit('Submit application')}
    </div>
  </form>`;
}

function applicationDialog(courses, requestId) {
  return `<dialog class="application-dialog" id="application-dialog" aria-labelledby="application-title">
    <div class="application-dialog__header">
      <div><h2 id="application-title">Course application</h2><p>All six fields are required.</p></div>
      <button class="icon-btn" type="button" data-apply-close aria-label="Close application">${close}</button>
    </div>
    ${applicationForm(courses, { requestId })}
    <div class="application-success" data-apply-success hidden>
      <h3 tabindex="-1">Application received</h3>
      <p>Keep this reference for your records.</p><p class="reference" data-apply-reference></p>
      <button type="button" class="btn btn--primary" data-apply-close>Done</button>
    </div>
  </dialog>`;
}

export function application(courses, values, message = '') {
  return page('Course application', `<main class="inner wrap" id="main">
    <a class="text-link" href="/#courses">Back to courses</a>
    <div class="apply-layout"><div class="apply-intro"><h1>Course application</h1><p class="lead">All six fields are required.</p></div>
    ${applicationForm(courses, values, message)}
    </div></main>`);
}

export function applicationReceived(reference) {
  return page('Application received', `<main class="inner wrap" id="main"><div class="confirmation">
    <h1>Application received</h1><p>Dealatecorp has received your application. Keep this reference for your records.</p>
    <p class="reference">${esc(reference)}</p>${cta('/#courses', 'Back to courses', { secondary: true })}
  </div></main>`);
}

export function privacy({ persistApplications = true } = {}) {
  return page('Application privacy', `<main class="inner wrap" id="main"><div class="prose">
    <h1>Application privacy</h1>
    <p>The application form collects your name, email address, college, phone number, course and duration. Dealatecorp uses these details to review your application and contact you about it.</p>
    ${persistApplications ? '<p>Authorized staff can view applications. When email delivery is configured, the email provider processes the application confirmation and admissions notification.</p>' : '<p>This website does not save application details in a database. It sends them to Dealatecorp HR through EmailJS so the team can respond. EmailJS processes the message for delivery.</p>'}
    <p>To ask about your information or request a correction, <a href="mailto:hr@dealatecorp.in">email Dealatecorp HR</a>.</p>
    <p>The HR contact form sends your name, email address and message through EmailJS so Dealatecorp can reply.</p>
    <a class="text-link" href="/apply">Back to the application</a>
  </div></main>`, publicHeader, false);
}

export function login(message = '', configured = true) {
  return page('Admin sign in', `<main class="inner wrap" id="main"><div class="login">
    <h1>Admin sign in</h1><p>Manage Dealatecorp’s training website and course applications.</p>
    ${configured ? `<form class="form" action="/admin/login" method="post">
      ${notice(message, true)}<label>Admin password<input name="password" type="password" autocomplete="current-password" required maxlength="512"></label>
      ${submit('Sign in')}
    </form>` : notice('Admin access requires a password configured on the server.')}
  </div></main>`, '');
}

const adminSections = { applications: 'Applications', ...Object.fromEntries(Object.entries(contentTypes).map(([key, type]) => [key, type.label])) };

function contentForm(kind, record = {}) {
  const type = contentTypes[kind];
  const field = ([key, [label, max, optional]]) => max > 200
    ? `<label>${label}<textarea name="${key}" maxlength="${max}"${optional ? '' : ' required'} rows="3">${esc(record[key])}</textarea></label>`
    : input(key, label, record, `maxlength="${max}"${optional ? '' : ' required'}`);
  return `<form class="form editor-form" action="/admin/${kind}/save" method="post" enctype="multipart/form-data">
    <input type="hidden" name="id" value="${esc(record.id)}"><input type="hidden" name="revision" value="${esc(record.revision)}">
    ${Object.entries(type.fields).map(field).join('')}
    ${type.image ? `<div class="editor-image">
      ${record.hasImage ? `<img src="${media(record)}" width="120" height="80" alt="Current ${type.image.toLowerCase()}" loading="lazy">` : ''}
      <label>${record.hasImage ? 'Replace ' + type.image.toLowerCase() : type.image}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="${kind}-file-${record.id || 'new'}"></label>
      <p class="field-note" id="${kind}-file-${record.id || 'new'}">JPEG, PNG or WebP up to 5 MB.${record.hasImage ? ' Leave blank to keep the current image.' : ''}</p>
    </div>` : ''}
    ${submit(record.id ? 'Save changes' : `Add ${type.singular}`)}
  </form>`;
}

function contentList(kind, rows) {
  const type = contentTypes[kind];
  return `<div class="editor">
    ${rows.map(record => `<details class="editor-row"><summary>${esc(record.name)}${record.hasImage ? '<span>Image uploaded</span>' : ''}</summary>
      <div class="editor-body">${contentForm(kind, record)}
        <details class="remove"><summary>Remove ${type.singular}</summary>
          <form action="/admin/${kind}/delete" method="post" class="form">
            <input type="hidden" name="id" value="${record.id}"><input type="hidden" name="revision" value="${record.revision}">
            <label class="check"><input type="checkbox" name="confirm" value="yes" required> Confirm removal of ${esc(record.name)}</label>
            <button class="btn btn--secondary" type="submit">Remove ${type.singular}</button>
          </form>
        </details>
      </div>
    </details>`).join('')}
    ${!rows.length ? `<p class="empty">No ${type.label.toLowerCase()} have been added.</p>` : ''}
    ${kind !== 'hero' || !rows.length ? `<details class="editor-row editor-new"><summary>Add ${type.singular}</summary><div class="editor-body">${contentForm(kind)}</div></details>` : ''}
  </div>`;
}

function applicationList(rows, filter, emailConfigured) {
  return `<div class="queue">
    <form class="filter" action="/admin/applications" method="get"><label>Application status<select name="status">${option('', 'All statuses', filter)}${statuses.map(status => option(status, status, filter)).join('')}</select></label><button type="submit" class="btn btn--secondary">Filter</button></form>
    ${!emailConfigured ? '<p class="notice">Email delivery is awaiting configuration. Applications are still saved.</p>' : ''}
    ${rows.length ? `<div class="table-wrap" role="region" aria-label="Course applications" tabindex="0"><table>
    <thead><tr><th scope="col">Applicant</th><th scope="col">Course and duration</th><th scope="col">Received</th><th scope="col">Status</th></tr></thead>
    <tbody>${rows.map(row => `<tr><td><strong>${esc(row.name)}</strong><br>${esc(row.college)}<br><a href="mailto:${esc(encodeURIComponent(row.email).replace('%40', '@'))}">${esc(row.email)}</a>${row.phone ? `<br>${esc(row.phone)}` : ''}</td>
    <td>${esc(row.course_name)}<br><span>${tracks[row.track].duration} — ${tracks[row.track].label}</span></td>
    <td><time datetime="${row.created_at}">${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(row.created_at))}</time><br><span>${row.reference}</span><br><span>${row.mail_failed ? 'Email requires attention' : row.mail_pending ? 'Email pending' : 'Email submitted'}</span></td>
    <td><form class="inline-form" action="/admin/applications/status" method="post"><input type="hidden" name="id" value="${row.id}"><input type="hidden" name="filter" value="${esc(filter)}">
    <label><span class="visually-hidden">Status for ${esc(row.name)}</span><select name="status">${statuses.map(status => option(status, status, row.status)).join('')}</select></label><button class="btn btn--secondary" type="submit">Save status</button></form></td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="empty">No applications match this view.</p>'}
  </div>`;
}

export function admin(kind, rows, { message = '', error = false, filter = '', emailConfigured = false } = {}) {
  const title = adminSections[kind];
  return page(title, `<main class="inner wrap admin" id="main">
    <p class="admin-label">Admin dashboard</p><h1>${title}</h1>
    <nav class="admin-nav" aria-label="Manage content">${Object.entries(adminSections).map(([key, label]) =>
      `<a href="/admin/${key}"${key === kind ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    ${notice(message, error)}
    ${kind === 'applications' ? applicationList(rows, filter, emailConfigured) : contentList(kind, rows)}
  </main>`, '<form action="/admin/logout" method="post"><button class="btn btn--secondary" type="submit">Sign out</button></form>');
}

export function errorPage(message) {
  return page('Request could not be completed', `<main class="inner wrap" id="main"><div class="prose"><h1>Request could not be completed</h1><p>${esc(message)}</p><a class="text-link" href="/">Return to Dealatecorp</a></div></main>`);
}

