async page => {
  const base = new URL(page.url()).origin;
  const expect = (condition, message) => { if (!condition) throw new Error(message); };
  const shot = (file, fullPage = false) => page.screenshot({ path: `shots/${file}.png`, fullPage, animations: 'disabled' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 500 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`);
  });

  for (const [width, height, name] of [
    [1440, 900, 'desktop'], [1280, 800, 'desktop-1280'], [1024, 768, 'desktop-1024'],
    [820, 1180, 'tablet-820'], [768, 1024, 'tablet'], [390, 844, 'mobile'], [320, 700, 'mobile-320'],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      heroBottom: document.querySelector('.hero').getBoundingClientRect().bottom,
      ctaBottom: document.querySelector('.hero .btn').getBoundingClientRect().bottom,
      compareBottom: document.querySelector('.hero .btn--secondary').getBoundingClientRect().bottom,
      chatTop: document.querySelector('.internship-chat > summary').getBoundingClientRect().top,
      font: document.fonts.check('16px "Schibsted Grotesk"'),
      colors: ['accent', 'paper', 'ink'].map(key => getComputedStyle(document.documentElement).getPropertyValue('--color-' + key).trim().toUpperCase()).join(','),
      primaryInk: getComputedStyle(document.querySelector('.nav .btn--primary')).color,
    }));
    expect(!layout.overflow, `Horizontal overflow at ${width}px`);
    expect(layout.font, `Brand font unavailable at ${width}px`);
    expect(layout.colors === '#20309A,#FFFFFF,#373737', 'Unexpected brand palette');
    expect(layout.primaryInk === 'rgb(255, 255, 255)', 'Primary button must use white text');
    expect(layout.ctaBottom <= height, `Hero CTA below fold at ${width}px`);
    if (width <= 600) expect(layout.compareBottom < layout.chatTop, `Chat overlaps a hero button at ${width}px`);
    expect(layout.heroBottom >= height - 1, `Second section visible at ${width}px`);
    if (['desktop', 'tablet', 'mobile'].includes(name)) await shot(name + '-full', true);
    await shot(name + '-hero');
  }
  await page.getByLabel('Menu', { exact: true }).click();
  await page.getByRole('navigation', { name: 'Mobile' }).waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.mobile-nav nav a')].every(link => link.style.opacity === ''));
  await shot('mobile-navigation');
  await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Courses', exact: true }).click();
  expect(!(await page.locator('.mobile-nav').getAttribute('open')), 'Mobile navigation did not close');
  expect(page.url().endsWith('#courses'), 'Mobile course anchor did not open');
  await page.getByLabel('Menu', { exact: true }).click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.activeElement.matches('.mobile-nav summary')), 'Escape did not restore menu focus');
  await page.locator('[data-course=agentic-ai]').click();
  expect((await page.locator('[data-course-name]').textContent()) === 'Agentic AI', 'Mobile course selection failed');
  const mobileDialog = page.getByRole('dialog', { name: 'Course application' });
  await page.locator('.track--normal .btn').click();
  await mobileDialog.waitFor();
  expect(await mobileDialog.locator('select[name=course]').inputValue() === 'agentic-ai', 'Mobile preselection failed');
  await shot('application-modal-mobile');
  await mobileDialog.getByRole('button', { name: 'Submit application' }).scrollIntoViewIfNeeded();
  expect(await mobileDialog.evaluate(dialog => dialog.scrollTop > 0), 'Narrow application dialog cannot scroll to the submit button');
  await page.keyboard.press('Escape');
  await mobileDialog.waitFor({ state: 'hidden' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base);
  const mainNav = page.getByRole('navigation', { name: 'Main' });
  const coursesLink = mainNav.getByRole('link', { name: 'Courses', exact: true });
  await coursesLink.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.nav__desktop a[href="/#courses"]'), '::after').transform === 'matrix(1, 0, 0, 1, 0, 0)');
  await coursesLink.click();
  await mainNav.locator('a[aria-current="location"][href="/#courses"]').waitFor();
  expect(await page.locator('#courses .course-benefits > div').count() === 3, 'Course benefits strip is missing');
  await page.goto(base);
  await page.getByRole('link', { name: 'Apply for an internship' }).click();
  expect(page.url().endsWith('#internship'), 'Hero CTA did not lead to internship applications');
  const closing = page.locator('#internship');
  const footer = page.locator('.closing');
  expect(await footer.getByText(/Open internship note|Admin sign in|Photography via Unsplash/).count() === 0, 'A removed footer item is still visible');
  expect(await footer.locator('.footer__stage').evaluate(stage => getComputedStyle(stage, '::before').backgroundImage.includes('training.webp')), 'Footer photo is missing');
  await footer.screenshot({ path: 'shots/internship-footer.png' });
  await closing.getByRole('link', { name: 'Apply now' }).click();
  const footerDialog = page.getByRole('dialog', { name: 'Course application' });
  await footerDialog.waitFor();
  expect(page.url().endsWith('#internship'), 'Footer application left the page');
  await page.keyboard.press('Escape');
  await footerDialog.waitFor({ state: 'hidden' });

  const endpoint = 'https://api.emailjs.com/api/v1.0/email/send';
  let hrRequests = 0;
  await page.route(endpoint, async route => {
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'Content-Type' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const payload = route.request().postDataJSON();
    expect(payload.service_id === 'service_zej18hh' && payload.template_id === 'template_gl9vfff' && !!payload.user_id, 'EmailJS configuration is incomplete');
    expect(payload.template_params.name === 'QA Sender' && payload.template_params.reply_to === 'qa@example.test' && payload.template_params.message === 'An internship question.', 'HR contact payload is incorrect');
    await route.fulfill({ status: ++hrRequests === 1 ? 503 : 200, headers, body: hrRequests === 1 ? 'Test failure' : 'OK' });
  });
  const emailLink = footer.getByRole('link', { name: 'Email HR' });
  await emailLink.click();
  const contact = page.getByRole('dialog', { name: 'Email Dealatecorp HR' });
  await contact.waitFor();
  const send = contact.getByRole('button', { name: 'Send message' });
  await send.click();
  expect(await contact.getByLabel('Your name').evaluate(input => input.validity.valueMissing), 'Contact form accepted an empty name');
  await contact.getByLabel('Your name').fill('QA Sender');
  await contact.getByLabel('Your email').fill('qa@example.test');
  await contact.getByLabel('Message').fill('An internship question.');
  await shot('hr-contact');
  await send.click();
  await contact.getByText(/could not be sent/).waitFor();
  expect(await contact.getByLabel('Message').inputValue() === 'An internship question.', 'Contact error lost the draft');
  await send.click();
  await contact.getByText(/message was sent/).waitFor();
  expect(hrRequests === 2, 'Unexpected EmailJS request count');
  await page.unroute(endpoint);
  await page.keyboard.press('Escape');
  await contact.waitFor({ state: 'hidden' });
  expect(await emailLink.evaluate(link => document.activeElement === link), 'Contact close did not restore focus');

  await page.goto(base);
  const guide = page.locator('[data-chat]');
  const launcher = guide.locator('summary');
  await launcher.click();
  await guide.getByRole('button', { name: 'How long are the tracks?' }).click();
  await guide.getByRole('log').getByText('The Normal track lasts 45 days. The Advanced track lasts 3 months.').waitFor();
  await guide.getByRole('textbox', { name: 'Your question' }).fill('How do I apply?');
  await guide.getByRole('button', { name: 'Send question' }).click();
  await guide.getByRole('log').getByText(/Open Internship applications/).waitFor();
  await shot('internship-chat');
  await page.keyboard.press('Escape');
  expect(await launcher.evaluate(element => document.activeElement === element && !element.parentElement.open), 'Chat close did not restore focus');

  await page.goto(base + '/#courses');
  expect(await page.evaluate(() => Boolean(window.gsap)), 'GSAP did not load');
  const choices = page.locator('[data-course]');
  const heading = page.locator('[data-course-name]');
  expect(await choices.count() === 8, 'Eight course images were expected');
  const firstPhoto = choices.first().locator('img');
  expect(await firstPhoto.evaluate(image => getComputedStyle(image).filter === 'grayscale(1)'), 'Course photo did not start in grayscale');
  await firstPhoto.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-course=python] img')).filter === 'grayscale(0)');
  expect(await firstPhoto.evaluate(image => image.currentSrc.endsWith('.webp')), 'Course photo is not a WebP photograph');
  const advanced = page.locator('.track--advanced');
  const normal = page.locator('.track--normal');
  const labels = [];
  for (const choice of await choices.all()) {
    const name = await choice.locator('[data-course-label]').textContent();
    labels.push(name);
    await choice.locator('img').hover();
    await choice.locator('img').evaluate(image => image.decode());
    expect(await heading.textContent() === name, `Course hover failed for ${name}`);
    expect(await normal.locator('[data-description]').textContent() !== await advanced.locator('[data-description]').textContent(), 'Both durations show the same description');
    await choice.click();
    expect(await choice.getAttribute('aria-current') === 'true', `Selection failed for ${name}`);
  }
  await choices.nth(5).focus();
  await page.keyboard.press('Enter');
  expect(await choices.nth(5).getAttribute('aria-current') === 'true', 'Keyboard selection failed');
  await page.waitForFunction(() => !document.querySelector('[data-course-name]').style.opacity);
  await page.locator('.courses').screenshot({ path: 'shots/course-comparison.png', animations: 'disabled' });
  const dialog = page.getByRole('dialog', { name: 'Course application' });
  const normalApply = normal.getByRole('link', { name: /Apply now/ });
  await normalApply.hover();
  expect(await normalApply.evaluate(button => button.style.getPropertyValue('--fill-size') !== ''), 'Pointer-origin button fill did not initialize');
  await normalApply.click();
  await dialog.waitFor();
  expect(await dialog.locator('select[name=course]').inputValue() === 'generative-ai', 'Course preselection failed');
  expect(await dialog.locator('select[name=track]').inputValue() === 'normal', 'Normal duration preselection failed');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  expect(await normalApply.evaluate(link => document.activeElement === link), 'Application close did not restore focus');
  await page.locator('[data-course=cloud]').click();
  const courseURL = page.url();
  await advanced.getByRole('link', { name: /Apply now/ }).click();
  expect(page.url() === courseURL, 'Opening the application changed the page URL');
  expect(await dialog.locator('select[name=course]').inputValue() === 'cloud', 'Advanced course preselection failed');
  expect(await dialog.locator('select[name=track]').inputValue() === 'advanced', 'Advanced duration preselection failed');
  const replacementImage = await shot('application');
  await dialog.getByRole('button', { name: 'Submit application' }).click();
  expect(await dialog.locator('input[name=name]').evaluate(input => input.validity.valueMissing), 'Native required validation failed');
  expect(await dialog.locator('input[name=phone]').evaluate(input => input.validity.valueMissing), 'Phone is not required');
  await dialog.getByLabel('Full name').fill('QA Student');
  await dialog.getByLabel('Email address').fill('qa.student@example.test');
  await dialog.getByLabel('College or university').fill('QA College');
  await dialog.getByLabel('Phone number').fill('invalid');
  await dialog.getByRole('button', { name: 'Submit application' }).click();
  await dialog.getByRole('alert').filter({ hasText: 'Enter a valid phone' }).waitFor();
  expect(await dialog.getByLabel('Full name').inputValue() === 'QA Student', 'Server validation lost form values');
  await dialog.getByLabel('Phone number').fill('+91 80000 00000');
  await dialog.getByRole('button', { name: 'Submit application' }).click();
  await dialog.getByRole('heading', { name: 'Application received' }).waitFor();
  expect(/^DC-[0-9A-F]{32}$/.test(await dialog.locator('.reference').textContent()), 'Application reference missing');
  expect(page.url() === courseURL, 'Submitting the application changed the page URL');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await dialog.waitFor({ state: 'hidden' });

  await page.goto(base + '/#colleges');
  expect(await page.getByRole('heading', { name: 'GMR Institute of Technology' }).count() === 1, 'Original college name missing');
  await page.locator('.college-logo img').evaluate(image => image.decode());
  expect(await page.getByText('See internship updates').count() === 0, 'Obsolete college link is present');
  expect(await page.locator('.footer__main').getByRole('link', { name: 'Email HR' }).getAttribute('href') === 'mailto:hr@dealatecorp.in', 'HR quick link fallback is incorrect');
  await page.locator('#colleges').screenshot({ path: 'shots/college-collaboration.png' });
  await page.goto(base + '/#testimonials');
  const cards = page.locator('.story');
  expect(await cards.count() === 10, 'Ten imported student profiles were expected');
  expect(await cards.getByText('Experience at Dealatecorp', { exact: true }).count() === 10, 'Experience label missing from a student profile');
  await page.mouse.move(8, 8);
  await cards.first().locator('img').evaluate(image => image.decode());
  expect(await cards.first().locator('img').evaluate(image => getComputedStyle(image).filter === 'grayscale(1)'), 'Student portrait did not start in grayscale');
  await cards.first().locator('.story__copy').hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.story img')).filter === 'grayscale(0)');
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.story h3')).opacity === '1');
  await page.locator('#testimonials').screenshot({ path: 'shots/student-showcase.png' });
  await page.getByRole('button', { name: 'Next student' }).click();
  await page.waitForFunction(() => document.querySelector('[data-cohort-status]').textContent === '2 of 10');
  await page.locator('.stories').focus();
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('[data-cohort-status]').textContent === '10 of 10');
  await cards.last().locator('img').evaluate(image => image.decode());
  expect(await page.getByRole('button', { name: 'Next student' }).isDisabled(), 'End of the student showcase is not indicated');

  await page.goto(base + '/#certificates');
  const certificate = page.getByRole('link', { name: /Preview sample Course/ });
  await certificate.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  await page.locator('.preview img').evaluate(img => img.decode());
  await shot('certificate-preview');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.activeElement.matches('[data-preview]')), 'Dialog did not restore focus');
  await page.getByRole('link', { name: /Preview sample Internship/ }).click();
  await page.getByRole('button', { name: 'Close preview' }).click();
  expect(!(await page.getByRole('dialog').isVisible()), 'Close preview did not close');

  await page.goto(base + '/admin');
  await page.getByLabel('Admin password').fill('wrong-test-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('alert').filter({ hasText: 'incorrect' }).waitFor();
  await page.getByLabel('Admin password').fill('browser-test-only-2026');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'Applications' }).waitFor();
  const student = page.getByRole('row').filter({ hasText: 'qa.student@example.test' }).first();
  await student.getByRole('combobox').selectOption('In review');
  await student.getByRole('button', { name: 'Save status' }).click();
  await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
  await page.getByLabel('Application status').selectOption('In review');
  await page.getByRole('button', { name: 'Filter' }).click();
  await student.waitFor();
  await shot('admin-applications');
  const png = await page.screenshot();
  const img = { name: 'qa.png', mimeType: 'image/png', buffer: png };
  const replacement = { name: 'qa-replacement.png', mimeType: 'image/png', buffer: replacementImage };
  const adminNav = page.getByRole('navigation', { name: 'Manage content' });
  const cases = [
    ['Courses', 'course', 'Course name', { 'Normal description': 'Normal syllabus', 'Advanced description': 'Advanced syllabus' }, null],
    ['Colleges', 'college', 'College name', { 'Location or collaboration details': 'QA details' }, 'College logo'],
    ['Testimonials', 'testimonial', 'Student name', {
      'College details': 'QA college', 'Internship experience': 'QA project experience', 'Skills and knowledge gained': 'QA skills', 'Student testimonial': 'QA quote',
    }, 'Student photograph'],
    ['Certificates', 'certificate', 'Certificate title', {}, 'Certificate image'],
    ['Hero image', 'hero image', 'Image description (alt text)', {}, 'Training photograph'],
  ];
  for (const [section, noun, title, fields, image] of cases) {
    const name = `QA ${noun}`;
    await adminNav.getByRole('link', { name: section, exact: true }).click();
    const create = page.locator('.editor-new');
    await create.locator('summary').click();
    await create.getByLabel(title, { exact: true }).fill(name);
    for (const [field, value] of Object.entries(fields)) await create.getByLabel(field, { exact: true }).fill(value);
    if (image) await create.getByLabel(image, { exact: true }).setInputFiles(img);
    await create.getByRole('button', { name: `Add ${noun}` }).click();
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    let record = page.locator('.editor-row').filter({ has: page.locator('summary').filter({ hasText: name }) });
    await record.locator(':scope > summary').click();
    await record.getByLabel(title, { exact: true }).fill(name + ' edited');
    if (image) {
      await record.getByLabel(`Replace ${image.toLowerCase()}`, { exact: true }).setInputFiles(replacement);
    }
    await record.getByRole('button', { name: 'Save changes' }).click();
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    record = page.locator('.editor-row').filter({ has: page.locator('summary').filter({ hasText: name + ' edited' }) });
    await record.locator(':scope > summary').click();
    if (image) {
      const imageUrl = await record.locator('img').getAttribute('src');
      expect(imageUrl.endsWith('?v=2'), `Image replacement failed for ${noun}`);
      await record.locator('img').evaluate(image => image.decode());
      const stored = await page.request.get(new URL(imageUrl, base).href);
      expect((await stored.body()).equals(replacementImage), `Replacement bytes were not saved for ${noun}`);
    }
    const publicSite = await page.request.get(base);
    const publicHtml = await publicSite.text();
    expect(publicHtml.includes(name + ' edited'), `Published content missing for ${noun}`);
    if (noun === 'testimonial') expect(publicHtml.includes('QA project experience'), 'Published experience was replaced by the cohort fallback');
    await record.locator('.remove summary').click();
    await record.getByRole('checkbox').check();
    await record.getByRole('button', { name: `Remove ${noun}` }).click();
    await page.getByRole('status').filter({ hasText: 'Changes saved' }).waitFor();
    expect(await record.count() === 0, `Delete failed for ${noun}`);
  }
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('heading', { name: 'Admin sign in' }).waitFor();
  expect(await page.getByText('QA Student').count() === 0, 'Admin data visible after sign out');

  const context = await page.context().browser().newContext({ javaScriptEnabled: false });
  try {
    const noJS = await context.newPage();
    await noJS.goto(base);
    await noJS.locator('[data-course=salesforce]').click();
    expect((await noJS.locator('[data-course-name]').textContent()) === 'Salesforce', 'No-script selection failed');
    await noJS.locator('.track--advanced .btn').click();
    expect(new URL(noJS.url()).pathname === '/apply', 'No-script application fallback failed');
    expect(await noJS.locator('select[name=track]').inputValue() === 'advanced', 'No-script duration preselection failed');
    await noJS.goto(base + '/#certificates');
    await noJS.getByRole('link', { name: /Preview sample Course/ }).click();
    expect(new URL(noJS.url()).pathname === '/assets/course-certificate.svg', 'No-script gallery link failed');
  } finally {
    await context.close();
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base + '/#courses');
  await page.locator('[data-course=java] img').hover();
  expect(await page.locator('[data-course-name]').textContent() === 'Java Programming', 'Reduced-motion course preview failed');
  expect(await page.locator('[data-course-name]').evaluate(heading => heading.style.opacity === ''), 'Reduced-motion preview started a reveal tween');
  expect(!errors.length, errors.join('\n'));
  return { passed: true, viewportSizes: 7, courseComparisons: labels.length, adminCRUDFlows: cases.length };
}

