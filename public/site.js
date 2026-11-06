const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const animation = window.gsap;
const modified = event => event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

const mobileNav = document.querySelector('.mobile-nav');
if (mobileNav) {
  mobileNav.addEventListener('click', event => {
    if (event.target.closest('a')) mobileNav.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileNav.open) {
      mobileNav.open = false;
      mobileNav.querySelector('summary').focus();
    }
  });
  mobileNav.addEventListener('toggle', () => {
    if (mobileNav.open && !reducedMotion.matches) {
      animation?.fromTo(mobileNav.querySelectorAll('nav a'), { y: 6, opacity: .55 },
        { y: 0, opacity: 1, stagger: .055, duration: .45, ease: 'power3.out', overwrite: true, clearProps: 'transform,opacity' });
    }
  });
}

const desktopNav = document.querySelector('.nav__desktop');
if (desktopNav) {
  const links = [...desktopNav.querySelectorAll('a')];
  const mobileLinks = [...mobileNav.querySelectorAll('a')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  let current = -1;
  let queued = false;

  function updateSection() {
    queued = false;
    const marker = innerHeight * .35;
    const index = sections.findIndex(section => {
      if (!section) return false;
      const { top, bottom } = section.getBoundingClientRect();
      return top <= marker && bottom > marker;
    });
    if (index === current) return;
    for (const items of [links, mobileLinks]) {
      items[current]?.removeAttribute('aria-current');
      items[index]?.setAttribute('aria-current', 'location');
    }
    current = index;
  }

  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(updateSection);
  }, { passive: true });
  window.addEventListener('resize', updateSection);
  document.fonts.ready.then(updateSection);
  updateSection();
}

if (animation && !reducedMotion.matches && !matchMedia('(pointer: coarse)').matches) {
  for (const item of document.querySelectorAll('.college-list li')) {
    const logo = item.querySelector('.college-logo img');
    if (!logo) continue;
    item.addEventListener('pointerenter', () => animation.to(logo, { scale: 1.025, duration: .45, ease: 'power3.out', overwrite: 'auto' }));
    item.addEventListener('pointerleave', () => animation.to(logo, { scale: 1, duration: .4, ease: 'power3.out', overwrite: 'auto', clearProps: 'transform' }));
  }
}

const comparison = document.querySelector('[data-compare]');
if (comparison) {
  const choices = [...comparison.querySelectorAll('[data-course]')];
  const details = new Map([...comparison.querySelectorAll('[data-course-detail]')].map(template =>
    [template.dataset.courseDetail, template.content]));
  const panel = comparison.querySelector('.course-details');
  const heading = panel.querySelector('[data-course-name]');
  const tracks = [...panel.querySelectorAll('.track')].map(track => ({
    description: track.querySelector('[data-description]'),
    duration: track.querySelector('h4').textContent,
    apply: track.querySelector('.btn'),
  }));
  let selected = choices.find(choice => choice.hasAttribute('aria-current'));
  let displayed = selected;

  function show(choice) {
    if (choice === displayed) return;
    displayed = choice;
    const id = choice.dataset.course;
    const detail = details.get(id);
    const name = detail.querySelector('[data-name]').textContent;
    heading.textContent = name;
    for (const track of tracks) {
      const key = track.description.dataset.description;
      track.description.textContent = detail.querySelector(`[data-${key}]`).textContent;
      track.apply.href = `/apply?course=${encodeURIComponent(id)}&track=${key}`;
      track.apply.setAttribute('aria-label', `Apply now for ${name}, ${track.duration}`);
    }
    for (const link of choices) link.toggleAttribute('data-previewed', link === choice);
    if (animation && !reducedMotion.matches) {
      animation.fromTo([heading, ...tracks.map(track => track.description)],
        { y: 10, opacity: .25 },
        { y: 0, opacity: 1, duration: .45, ease: 'power3.out', stagger: .035, overwrite: true, clearProps: 'transform,opacity' });
    }
  }

  for (const choice of choices) {
    const photo = choice.querySelector('.course-image img');
    choice.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      show(choice);
      if (!reducedMotion.matches) animation?.to(photo, { scale: 1.03, duration: .48, ease: 'power3.out', overwrite: 'auto' });
    });
    choice.addEventListener('pointerleave', () => {
      if (!reducedMotion.matches) animation?.to(photo, { scale: 1, duration: .4, ease: 'power3.out', overwrite: 'auto', clearProps: 'transform' });
    });
    choice.addEventListener('focus', () => {
      if (choice.matches(':focus-visible')) show(choice);
    });
    choice.addEventListener('click', event => {
      if (modified(event)) return;
      event.preventDefault();
      selected.removeAttribute('aria-current');
      selected = choice;
      selected.setAttribute('aria-current', 'true');
      show(choice);
      const url = new URL(location.href);
      url.searchParams.set('course', choice.dataset.course);
      history.replaceState(null, '', url);
      document.querySelector('#course-status').textContent = `Showing both tracks for ${heading.textContent}.`;
      if (matchMedia('(max-width: 720px)').matches) {
        panel.focus({ preventScroll: true });
        panel.scrollIntoView({ block: 'start' });
      }
    });
  }
  comparison.addEventListener('pointerleave', () => {
    if (!comparison.contains(document.activeElement) || !document.activeElement.matches(':focus-visible')) show(selected);
  });
}

const cohort = document.querySelector('[data-cohort]');
if (cohort) {
  const rail = cohort.querySelector('.stories');
  const cards = [...rail.children];
  const controls = cohort.querySelector('.cohort__controls');
  const prev = controls.querySelector('.cohort__prev');
  const next = controls.querySelector('.cohort__next');
  const status = controls.querySelector('[data-cohort-status]');
  let index = 0;
  controls.hidden = cards.length < 2;

  function updateControls() {
    const left = rail.getBoundingClientRect().left;
    index = cards.reduce((nearest, card, i) => (
      Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[nearest].getBoundingClientRect().left - left) ? i : nearest
    ), 0);
    const text = `${index + 1} of ${cards.length}`;
    if (status.textContent !== text) status.textContent = text;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
  }

  function move(target) {
    const card = cards[Math.max(0, Math.min(target, cards.length - 1))];
    rail.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  prev.addEventListener('click', () => move(index - 1));
  next.addEventListener('click', () => move(index + 1));
  rail.addEventListener('scroll', updateControls, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(updateControls).observe(rail);
  rail.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    move({ ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: cards.length - 1 }[event.key]);
  });
  updateControls();

  if (animation && 'IntersectionObserver' in window) {
    animation.matchMedia().add('(prefers-reduced-motion: no-preference)', context => {
      context.add('reveal', card => {
        animation.fromTo(card.querySelectorAll('.story__copy > *'),
          { y: 16, opacity: .25 }, { y: 0, opacity: 1, duration: .65, ease: 'power3.out', stagger: .07 });
        const portrait = card.querySelector('.story__portrait img');
        if (portrait) animation.fromTo(portrait, { scale: 1.06 }, { scale: 1, duration: .75, ease: 'power3.out' });
      });
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          context.reveal(entry.target);
          observer.unobserve(entry.target);
        }
      }, { threshold: .52 });
      for (const card of cards) observer.observe(card);
      return () => observer.disconnect();
    });
  }
}

const preview = document.querySelector('.preview');
if (preview && typeof preview.showModal === 'function') {
  const previewTitle = preview.querySelector('h3');
  const previewImage = preview.querySelector('img');
  let opener;
  for (const link of document.querySelectorAll('a[data-preview]')) {
    link.addEventListener('click', event => {
      if (modified(event)) return;
      event.preventDefault();
      opener = link;
      previewTitle.textContent = link.dataset.preview;
      previewImage.alt = link.querySelector('img').alt;
      previewImage.src = link.href;
      preview.showModal();
    });
  }
  preview.addEventListener('click', event => {
    if (event.target === preview) preview.close();
  });
  preview.addEventListener('close', () => opener?.focus());
}

const dialog = document.querySelector('#application-dialog');
const application = dialog?.querySelector('.application-form');
if (dialog && typeof dialog.showModal === 'function') {
  const error = dialog.querySelector('[data-apply-error]');
  const success = dialog.querySelector('[data-apply-success]');
  const submit = application.querySelector('[type=submit]');
  const closeButton = dialog.querySelector('.application-dialog__header button');
  let opener;
  const applyLinks = 'a[href="/apply"], a[href^="/apply?"]';

  for (const link of document.querySelectorAll(applyLinks)) link.setAttribute('aria-haspopup', 'dialog');
  document.addEventListener('click', event => {
    const link = event.target.closest(applyLinks);
    if (!link || event.defaultPrevented || modified(event)) return;
    event.preventDefault();
    opener = link;
    const params = new URL(link.href).searchParams;
    for (const key of ['course', 'track']) {
      if (params.has(key)) application.elements.namedItem(key).value = params.get(key);
    }
    error.hidden = true;
    success.hidden = true;
    application.hidden = false;
    dialog.showModal();
    application.elements.namedItem('name').focus();
  });

  dialog.addEventListener('click', event => {
    if (!submit.disabled && (event.target === dialog || event.target.closest('[data-apply-close]'))) dialog.close();
  });
  dialog.addEventListener('cancel', event => {
    if (submit.disabled) event.preventDefault();
  });
  dialog.addEventListener('close', () => {
    const menu = opener?.closest('.mobile-nav');
    (menu ? menu.querySelector('summary') : opener)?.focus();
  });
  application.addEventListener('input', () => { error.hidden = true; });
  application.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const data = new URLSearchParams(new FormData(application));
    closeButton.disabled = submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    error.hidden = true;
    try {
      const response = await fetch(application.action, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
      const result = await response.json();
      if (!response.ok) {
        error.textContent = result.message;
        error.hidden = false;
        return;
      }
      application.reset();
      application.elements.requestId.value = result.requestId;
      application.hidden = true;
      dialog.querySelector('[data-apply-reference]').textContent = result.reference;
      success.hidden = false;
      success.querySelector('h3').focus();
    } catch {
      error.textContent = 'The application could not be confirmed. Please try again.';
      error.hidden = false;
    } finally {
      closeButton.disabled = submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }
  });
}

function setButtonOrigin(button, event) {
  const rect = button.getBoundingClientRect();
  const x = event ? event.clientX - rect.left : rect.width / 2;
  const y = event ? event.clientY - rect.top : rect.height / 2;
  const diameter = 2 * Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
  button.style.setProperty('--fill-x', x + 'px');
  button.style.setProperty('--fill-y', y + 'px');
  button.style.setProperty('--fill-size', Math.ceil(diameter) + 'px');
}

for (const button of document.querySelectorAll('.btn, .icon-btn, .mobile-nav summary')) {
  button.addEventListener('pointerenter', event => setButtonOrigin(button, event));
  button.addEventListener('pointerdown', event => setButtonOrigin(button, event));
  button.addEventListener('focus', () => {
    if (button.matches(':focus-visible')) setButtonOrigin(button);
  });
}

const chat = document.querySelector('[data-chat]');
if (chat) {
  const launcher = chat.querySelector('summary');
  const closeGuide = chat.querySelector('[data-chat-close]');
  const log = chat.querySelector('.chat__messages');
  const form = chat.querySelector('.chat__form');
  const input = form.elements.namedItem('question');
  const prompts = chat.querySelector('.chat__prompts');
  const answers = new Map([...chat.querySelectorAll('[data-chat-answer]')].map(item =>
    [item.dataset.chatAnswer, item.content.textContent]));
  form.hidden = false;
  prompts.hidden = false;
  closeGuide.hidden = false;

  function answer(question, topic) {
    const message = document.createElement('p');
    message.className = 'chat__message--question';
    message.textContent = question;
    const response = document.createElement('p');
    response.textContent = answers.get(topic) || 'I can answer questions about courses, duration and applying. For anything else, use Email HR below.';
    log.append(message, response);
    log.scrollTop = log.scrollHeight;
  }

  for (const button of prompts.querySelectorAll('button')) {
    button.addEventListener('click', () => answer(button.textContent, button.dataset.chatQuestion));
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    // shortcut: three keyword topics, expand when the guide has more approved answers.
    const topics = {
      apply: /\b(apply|application|admission|enrol|enroll|register)\b/i,
      duration: /\b(duration|long|days?|months?|weeks?|normal|advanced|tracks?)\b/i,
      courses: /\b(courses?|python|java|salesforce|cloud|programming|ai)\b/i,
    };
    const topic = Object.keys(topics).find(key => topics[key].test(question));
    answer(question, topic);
    form.reset();
    input.focus();
  });
  function closeChat() {
    chat.open = false;
    launcher.focus();
  }
  closeGuide.addEventListener('click', closeChat);
  chat.addEventListener('keydown', event => {
    if (event.key === 'Escape' && chat.open) closeChat();
  });
  chat.addEventListener('toggle', () => {
    if (chat.open && !reducedMotion.matches) {
      animation?.fromTo(chat.querySelector('.chat__window'), { y: 10, opacity: .5 },
        { y: 0, opacity: 1, duration: .35, ease: 'power3.out', overwrite: true, clearProps: 'transform,opacity' });
    }
  });
}

const contact = document.querySelector('#contact-dialog');
if (contact && typeof contact.showModal === 'function') {
  const form = contact.querySelector('[data-hr-form]');
  const submit = form.querySelector('[type=submit]');
  const status = form.querySelector('[data-hr-status]');
  let opener;
  for (const link of document.querySelectorAll('a[data-email-hr], button[data-email-hr]')) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (modified(event)) return;
      event.preventDefault();
      opener = link;
      contact.showModal();
    });
  }
  contact.addEventListener('close', () => opener?.focus());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const { name, email, message } = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
    status.hidden = false;
    if (!name || !message) {
      status.textContent = 'Enter your name and a message.';
      return;
    }
    submit.disabled = true;
    status.textContent = 'Sending your message…';
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          user_id: '7jlnugNTa693uCIbD',
          service_id: 'service_zej18hh',
          template_id: 'template_gl9vfff',
          template_params: { name, email, message, title: 'Dealatecorp website enquiry', time: new Date().toISOString(), from_name: name, reply_to: email },
        }),
      });
      if (!response.ok) throw new Error('EmailJS delivery failed');
      form.reset();
      status.textContent = 'Your message was sent to Dealatecorp HR.';
    } catch {
      status.textContent = 'Your message could not be sent. Try again or use your email app.';
    } finally {
      submit.disabled = false;
    }
  });
}

