import { createServer } from 'node:http';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { additionalProfiles, cohort, collegeName, contentTypes, courses, partnerColleges, statuses, tracks } from './catalog.mjs';
import { admin, application, applicationReceived, errorPage, esc, home, login, privacy } from './views.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const imageLimit = 5 * 1024 * 1024;
const day = 24 * 60 * 60 * 1000;
const idPattern = /^[a-z0-9-]{1,60}$/;
const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;
const hash = value => createHash('sha256').update(value).digest();
const get = (form, name) => typeof form.get(name) === 'string' ? form.get(name).trim() : '';
const httpError = (status, message) => Object.assign(new Error(message), { status });
const staticTypes = { css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', jpg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2' };
const jsonType = 'application/json; charset=utf-8';
const acceptsJson = req => req.headers.accept === 'application/json';

function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS setup (id INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS content (
      kind TEXT NOT NULL, id TEXT NOT NULL, info TEXT NOT NULL, position INTEGER NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1, image BLOB, image_type TEXT,
      PRIMARY KEY (kind, id)
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, reference TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL, email TEXT NOT NULL, college TEXT NOT NULL, phone TEXT NOT NULL,
      course_id TEXT NOT NULL, course_name TEXT NOT NULL, track TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS outbox (
      application_id TEXT NOT NULL REFERENCES applications(id), audience TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt INTEGER NOT NULL DEFAULT 0, first_attempt INTEGER,
      payload TEXT, PRIMARY KEY (application_id, audience)
    );
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL);
  `);
  db.exec('BEGIN IMMEDIATE');
  try {
    if (db.prepare('INSERT OR IGNORE INTO setup VALUES (1)').run().changes) {
      const seed = db.prepare("INSERT INTO content(kind, id, info, position) VALUES ('courses', ?, ?, ?)");
      courses.forEach(([id, name, normal, advanced], index) => seed.run(id, JSON.stringify({ name, normal, advanced }), index));
    }
    if (db.prepare('INSERT OR IGNORE INTO setup VALUES (2)').run().changes) {
      const seed = db.prepare('INSERT OR IGNORE INTO content(kind, id, info, position, image, image_type) VALUES (?, ?, ?, ?, ?, ?)');
      const logo = readFileSync(resolve(root, 'public/assets/gmrit.png'));
      const college = db.prepare("SELECT id FROM content WHERE kind = 'colleges' AND lower(json_extract(info, '$.name')) = lower(?)").get(collegeName);
      if (college) {
        db.prepare("UPDATE content SET image = ?, image_type = 'image/png', revision = revision + 1 WHERE kind = 'colleges' AND id = ? AND image IS NULL")
          .run(logo, college.id);
      } else {
        seed.run('colleges', 'gmrit', JSON.stringify({ name: collegeName, detail: 'Internship cohort' }), 0, logo, 'image/png');
      }
      cohort.forEach(([id, name, department], index) => {
        const photo = readFileSync(resolve(root, 'content', 'portraits', id + '.jpg'));
        seed.run('testimonials', 'gmrit-' + id, JSON.stringify({ name, college: collegeName, department }), index, photo, 'image/jpeg');
      });
    }
    if (db.prepare('INSERT OR IGNORE INTO setup VALUES (3)').run().changes) {
      const add = db.prepare('INSERT OR IGNORE INTO content(kind, id, info, position, image, image_type) VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM content WHERE kind = ?), ?, ?)');
      partnerColleges.forEach(([id, name, asset, type]) => add.run('colleges', id, JSON.stringify({ name }), 'colleges', type ? readFileSync(resolve(root, 'public/assets', asset)) : null, type || null));
      additionalProfiles.forEach(([id, name, department], index) => add.run('testimonials', id, JSON.stringify({ name, college: partnerColleges[0][1], department }), 'testimonials', readFileSync(resolve(root, 'content/portraits', id + '.webp')), 'image/webp'));
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    db.close();
    throw error;
  }
  return db;
}

async function readForm(req, limit = 16 * 1024) {
  const type = req.headers['content-type'] || '';
  if (!/^(application\/x-www-form-urlencoded|multipart\/form-data)(?:;|$)/i.test(type)) {
    throw httpError(415, 'Submit the form from the website.');
  }
  if (Number(req.headers['content-length']) > limit) throw httpError(413, 'The form is too large.');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > limit) throw httpError(413, 'The form is too large.');
    chunks.push(chunk);
  }
  try {
    return await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': type } }).formData();
  } catch {
    throw httpError(400, 'The form could not be read.');
  }
}

async function readImage(file) {
  if (!file || file.size === 0) return {};
  if (!(file instanceof File) || file.size > imageLimit) throw httpError(422, 'Choose an image up to 5 MB.');
  const bytes = Buffer.from(await file.arrayBuffer());
  const png = bytes.length > 33 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    && bytes.toString('ascii', 12, 16) === 'IHDR';
  const jpeg = bytes.length > 8 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    && bytes.at(-2) === 255 && bytes.at(-1) === 217;
  const webp = bytes.length > 20 && bytes.toString('ascii', 0, 4) === 'RIFF'
    && bytes.readUInt32LE(4) + 8 === bytes.length && bytes.toString('ascii', 8, 12) === 'WEBP';
  const type = png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : '';
  if (!type || type !== file.type) throw httpError(422, 'Choose a valid JPEG, PNG or WebP image.');
  return { bytes, type };
}

function sendEmail(key, payload, idempotencyKey) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: payload,
    signal: AbortSignal.timeout(8000),
  });
}

export function createApp({
  dbPath = resolve(root, 'data', 'dealatecorp.sqlite'),
  adminPassword = process.env.ADMIN_PASSWORD || '',
  publicOrigin = process.env.PUBLIC_ORIGIN || '',
  email = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM, to: process.env.EMAIL_TO },
  deliver = sendEmail,
} = {}) {
  if (adminPassword && adminPassword.length < 16) throw new Error('ADMIN_PASSWORD must contain at least 16 characters.');
  const origin = publicOrigin ? new URL(publicOrigin).origin : '';
  if (publicOrigin && !origin.startsWith('https://') && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(origin)) {
    throw new Error('PUBLIC_ORIGIN must use HTTPS for a public site.');
  }
  const db = openDatabase(dbPath);
  const secure = origin.startsWith('https://');
  const emailConfigured = Boolean(email.key && email.from && email.to);
  const adminDigest = hash(adminPassword);
  const sessionDigest = token => createHmac('sha256', adminDigest).update(token).digest('hex');
  const rateBuckets = new Map();

  function rate(key, max, windowMs) {
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.end <= now) {
      for (const [id, entry] of rateBuckets) if (entry.end <= now) rateBuckets.delete(id);
      if (rateBuckets.size >= 5000) return false;
      bucket = { count: 0, end: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    return ++bucket.count <= max;
  }

  const rowsFor = kind => db.prepare(`SELECT kind, id, info, revision, image IS NOT NULL AS hasImage
    FROM content WHERE kind = ? ORDER BY position, id`).all(kind).map(({ info, ...row }) => ({ ...row, ...JSON.parse(info) }));

  function session(req) {
    const token = req.headers.cookie?.match(/(?:^|;\s*)dc_session=([a-f0-9-]{36})(?:;|$)/)?.[1];
    if (!token) return null;
    const digest = sessionDigest(token);
    return db.prepare('SELECT token FROM sessions WHERE token = ? AND expires > ?').get(digest, Date.now())?.token;
  }

  const cookie = (token, ttl) => `dc_session=${token}; Path=/admin; Max-Age=${ttl}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;

  let mailing = false;
  let closed = false;
  async function deliverPending() {
    if (!emailConfigured || mailing) return;
    mailing = true;
    try {
      const now = Date.now();
      const pending = db.prepare(`SELECT outbox.*, applications.name, applications.email, applications.reference,
        applications.course_name, applications.track FROM outbox
        JOIN applications ON applications.id = outbox.application_id
        WHERE state = 'pending' AND next_attempt <= ? ORDER BY next_attempt LIMIT 10`).all(now);
      for (const job of pending) {
        if (job.first_attempt && job.first_attempt < now - 23 * 60 * 60 * 1000) {
          db.prepare("UPDATE outbox SET state = 'failed' WHERE application_id = ? AND audience = ?").run(job.application_id, job.audience);
          continue;
        }
        const student = job.audience === 'student';
        const summary = `${job.course_name} — ${tracks[job.track].duration}\nReference: ${job.reference}`;
        const payload = job.payload || JSON.stringify({
          from: email.from,
          to: [student ? job.email : email.to],
          subject: student ? 'Dealatecorp received your application' : 'New Dealatecorp course application',
          text: student ? `Hello ${job.name},\n\nWe received your course application.\n${summary}`
            : `A new application is available in the Dealatecorp admin dashboard.\n${summary}`,
        });
        const claimed = db.prepare(`UPDATE outbox SET payload = ?, first_attempt = COALESCE(first_attempt, ?),
          attempts = attempts + 1, next_attempt = ? WHERE application_id = ? AND audience = ? AND state = 'pending' AND next_attempt <= ?`)
          .run(payload, now, now + 60_000 * (job.attempts + 1), job.application_id, job.audience, now);
        if (!claimed.changes) continue;
        try {
          const result = await deliver(email.key, payload, `${job.application_id}/${job.audience}`);
          if (result.ok) {
            db.prepare("UPDATE outbox SET state = 'sent' WHERE application_id = ? AND audience = ?").run(job.application_id, job.audience);
          } else if (result.status >= 400 && result.status < 500 && ![408, 409, 429].includes(result.status)) {
            db.prepare("UPDATE outbox SET state = 'failed' WHERE application_id = ? AND audience = ?").run(job.application_id, job.audience);
          }
          await result.body?.cancel();
        } catch {
          // The saved payload and provider key are reused at the next attempt.
        }
      }
    } finally {
      mailing = false;
      if (closed) db.close();
    }
  }

  function saveApplication(values, course) {
    const id = randomUUID();
    const reference = `DC-${id.replaceAll('-', '').toUpperCase()}`;
    db.exec('BEGIN IMMEDIATE');
    try {
      const prior = db.prepare('SELECT * FROM applications WHERE request_id = ?').get(values.requestId);
      if (prior) {
        if (prior.course_id !== values.course || !['track', 'name', 'email', 'college', 'phone'].every(key => prior[key] === values[key])) {
          throw httpError(409, 'This form was already submitted. Open a new application to make changes.');
        }
        db.exec('COMMIT');
        return prior.reference;
      }
      db.prepare(`INSERT INTO applications
        (id, request_id, reference, name, email, college, phone, course_id, course_name, track, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, values.requestId, reference, values.name, values.email,
        values.college, values.phone, course.id, course.name, values.track, new Date().toISOString());
      const queue = db.prepare('INSERT INTO outbox (application_id, audience) VALUES (?, ?)');
      queue.run(id, 'student');
      queue.run(id, 'admissions');
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    return reference;
  }

  function handleAdminList(kind, url, message = '', error = false) {
    const requested = url.searchParams.get('status');
    const filter = statuses.includes(requested) ? requested : '';
    const rows = kind === 'applications' ? db.prepare(`SELECT a.*,
      EXISTS(SELECT 1 FROM outbox o WHERE o.application_id = a.id AND o.state = 'pending') AS mail_pending,
      EXISTS(SELECT 1 FROM outbox o WHERE o.application_id = a.id AND o.state = 'failed') AS mail_failed
      FROM applications a WHERE (? = '' OR status = ?) ORDER BY created_at DESC`).all(filter, filter) : rowsFor(kind);
    return admin(kind, rows, { message, error, filter, emailConfigured });
  }

  async function route(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const method = req.method;
    const isRead = method === 'GET' || method === 'HEAD';
    const respond = (status, body, type = 'text/html; charset=utf-8', headers = {}) => {
      res.writeHead(status, { 'Content-Type': type, ...headers });
      res.end(method === 'HEAD' ? undefined : body);
    };
    const go = location => res.writeHead(303, { Location: location }).end();
    if (!isRead && method !== 'POST') return respond(405, errorPage('This method is unavailable.'), undefined, { Allow: 'GET, HEAD, POST' });
    if (method === 'POST') {
      const expected = origin || `http://${req.headers.host}`;
      if (req.headers.origin !== expected) throw httpError(403, 'This form must be submitted from the Dealatecorp site.');
    }

    if (isRead && path === '/') {
      const data = Object.fromEntries(Object.keys(contentTypes).map(kind => [kind, rowsFor(kind)]));
      return respond(200, home(data, url.searchParams.get('course'), origin, randomUUID()));
    }

    if (isRead && path === '/privacy') return respond(200, privacy());
    if (isRead && path === '/robots.txt') {
      return respond(200, `User-agent: *\nDisallow: /admin\nDisallow: /apply\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`, 'text/plain; charset=utf-8');
    }
    if (isRead && path === '/sitemap.xml' && origin) {
      return respond(200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(origin)}/</loc></url><url><loc>${esc(origin)}/privacy</loc></url></urlset>`, 'application/xml; charset=utf-8');
    }

    if (isRead && (path === '/assets/gsap.min.js' || /^\/(?:style|tokens|base)\.css$|^\/site\.js$|^\/assets\/[a-z0-9-]+\.(?:jpg|png|svg|webp|woff2|css)$/.test(path))) {
      try {
        const file = await readFile(resolve(root, 'public', path.slice(1)));
        return respond(200, file, staticTypes[path.split('.').at(-1)], { 'Cache-Control': 'public, no-cache' });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (isRead && path.startsWith('/media/')) {
      const [, , kind, id, extra] = path.split('/');
      if (Object.hasOwn(contentTypes, kind) && id && idPattern.test(id) && extra === undefined) {
        const row = db.prepare('SELECT image, image_type, revision FROM content WHERE kind = ? AND id = ?').get(kind, id);
        if (row?.image) return respond(200, row.image, row.image_type, { 'Cache-Control': 'public, no-cache' });
      }
    }

    if (path === '/apply' && isRead) {
      return respond(200, application(rowsFor('courses'), {
        course: url.searchParams.get('course'), track: url.searchParams.get('track'), requestId: randomUUID(),
      }));
    }
    if (path === '/apply' && method === 'POST') {
      const ip = req.socket.remoteAddress;
      if (!rate(`apply/${ip}`, 100, 600_000)) throw httpError(429, 'Too many attempts. Please try again later.');
      const form = await readForm(req);
      const values = Object.fromEntries(['requestId', 'course', 'track', 'name', 'email', 'college', 'phone'].map(key => [key, get(form, key)]));
      const available = rowsFor('courses');
      const course = available.find(row => row.id === values.course);
      let message = '';
      if (!uuidPattern.test(values.requestId)) message = 'Reload the form before submitting.';
      else if (!course || !Object.hasOwn(tracks, values.track)) message = 'Select a valid course and duration.';
      else if (values.name.length < 2 || values.name.length > 120) message = 'Enter a full name between 2 and 120 characters.';
      else if (values.email.length > 254 || !emailPattern.test(values.email)) message = 'Enter a valid email address.';
      else if (values.college.length < 2 || values.college.length > 160) message = 'Enter your college or university.';
      else if (!/^\+?[0-9 ()-]{7,30}$/.test(values.phone) || values.phone.replace(/\D/g, '').length < 7) message = 'Enter a valid phone number.';
      if (message) return acceptsJson(req)
        ? respond(422, JSON.stringify({ message }), jsonType)
        : respond(422, application(available, values, message));
      if (!rate(`email/${hash(values.email.toLowerCase()).toString('hex')}`, 8, 600_000)) throw httpError(429, 'Too many attempts for this email. Please try again later.');
      const reference = saveApplication(values, course);
      void deliverPending().catch(error => console.error('Email queue:', error.message));
      return acceptsJson(req)
        ? respond(201, JSON.stringify({ reference, requestId: randomUUID() }), jsonType)
        : go(`/apply/received?reference=${reference}`);
    }
    if (isRead && path === '/apply/received') {
      const reference = url.searchParams.get('reference') || '';
      if (/^DC-[0-9A-F]{32}$/.test(reference) && db.prepare('SELECT 1 FROM applications WHERE reference = ?').get(reference)) {
        return respond(200, applicationReceived(reference));
      }
    }

    if (path === '/admin' || path.startsWith('/admin/')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (!adminPassword) return respond(503, login('', false));
      const token = session(req);
      if (path === '/admin/login' && method === 'POST') {
        const ip = req.socket.remoteAddress;
        if (!rate(`login/${ip}`, 10, 900_000)) return respond(429, login('Too many attempts. Try again in 15 minutes.'));
        const form = await readForm(req);
        const password = form.get('password');
        if (typeof password !== 'string' || !timingSafeEqual(hash(password), adminDigest)) {
          return respond(401, login('The password was incorrect.'));
        }
        const freshToken = randomUUID();
        db.prepare('DELETE FROM sessions WHERE expires <= ? OR token = ?').run(Date.now(), token || '');
        db.prepare('INSERT INTO sessions VALUES (?, ?)').run(sessionDigest(freshToken), Date.now() + 8 * 60 * 60 * 1000);
        res.setHeader('Set-Cookie', cookie(freshToken, 8 * 60 * 60));
        return go('/admin/applications');
      }
      if (!token) return isRead ? respond(200, login()) : respond(401, login('Sign in to continue.'));
      if (path === '/admin/logout' && method === 'POST') {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
        res.setHeader('Set-Cookie', cookie('', 0));
        return go('/admin');
      }
      if (isRead && (path === '/admin' || path === '/admin/login')) return go('/admin/applications');
      const [, , kind, action, extra] = path.split('/');
      if (extra === undefined && (kind === 'applications' || Object.hasOwn(contentTypes, kind))) {
        if (isRead && action === undefined) {
          return respond(200, handleAdminList(kind, url, url.searchParams.has('saved') ? 'Changes saved.' : ''));
        }
        if (method === 'POST' && kind === 'applications' && action === 'status') {
          const form = await readForm(req);
          const status = get(form, 'status');
          if (!statuses.includes(status)) throw httpError(422, 'Choose a valid application status.');
          if (!db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, get(form, 'id')).changes) throw httpError(404, 'Application not found.');
          const filter = get(form, 'filter');
          return go(`/admin/applications?saved=1${statuses.includes(filter) ? `&status=${encodeURIComponent(filter)}` : ''}`);
        }
        if (method === 'POST' && kind !== 'applications' && ['save', 'delete'].includes(action)) {
          const type = contentTypes[kind];
          const form = await readForm(req, imageLimit + 64 * 1024);
          const recordId = get(form, 'id');
          const revision = Number(get(form, 'revision'));
          if (recordId && !idPattern.test(recordId)) throw httpError(422, 'Invalid content record.');
          if (action === 'delete') {
            if (get(form, 'confirm') !== 'yes') throw httpError(422, 'Confirm removal before continuing.');
            if (!db.prepare('DELETE FROM content WHERE kind = ? AND id = ? AND revision = ?').run(kind, recordId, revision).changes) {
              throw httpError(409, 'This record changed. Open it again before removing it.');
            }
          } else {
            const info = {};
            for (const [key, [label, limit, optional]] of Object.entries(type.fields)) {
              const value = get(form, key);
              if ((!optional && !value) || value.length > limit) throw httpError(422, `Enter ${label.toLowerCase()} within ${limit} characters.`);
              info[key] = value;
            }
            const { bytes, type: mime } = type.image ? await readImage(form.get('image')) : {};
            if (kind === 'hero' && !recordId && !bytes) throw httpError(422, 'Choose a training photograph.');
            if (recordId) {
              const changes = db.prepare(`UPDATE content SET info = ?, revision = revision + 1,
                image = COALESCE(?, image), image_type = COALESCE(?, image_type)
                WHERE kind = ? AND id = ? AND revision = ?`)
                .run(JSON.stringify(info), bytes || null, mime || null, kind, recordId, revision).changes;
              if (!changes) throw httpError(409, 'This record changed. Open it again before saving.');
            } else {
              const changes = db.prepare(`INSERT OR IGNORE INTO content(kind, id, info, position, image, image_type)
                VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM content WHERE kind = ?), ?, ?)`)
                .run(kind, kind === 'hero' ? 'hero' : randomUUID(), JSON.stringify(info), kind, bytes || null, mime || null).changes;
              if (!changes) throw httpError(409, 'Open the existing record to make changes.');
            }
          }
          return go(`/admin/${kind}?saved=1`);
        }
      }
    }
    return respond(404, errorPage('This page could not be found.'));
  }

  const server = createServer({ requestTimeout: 25_000, headersTimeout: 15_000 }, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https://siddhartha.edu.in; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self' https://api.emailjs.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    route(req, res).catch(error => {
      if (!error.status) console.error(error);
      if (res.headersSent) return res.destroy();
      const json = req.method === 'POST' && req.url === '/apply' && acceptsJson(req);
      const message = error.status ? error.message : 'Please try again later.';
      res.writeHead(error.status || 500, { 'Content-Type': json ? jsonType : 'text/html; charset=utf-8', ...(error.status === 413 ? { Connection: 'close' } : {}) });
      res.end(json ? JSON.stringify({ message }) : errorPage(message));
    });
  });
  const runMail = () => void deliverPending().catch(error => console.error('Email queue:', error.message));
  const timer = emailConfigured ? setInterval(runMail, 30_000) : null;
  timer?.unref();
  server.once('listening', runMail);
  server.on('close', () => {
    clearInterval(timer);
    closed = true;
    if (!mailing) db.close();
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 3000);
  createApp({ dbPath: process.env.DB_PATH || undefined }).listen(port, host, () => console.log(`Dealatecorp at http://${host}:${port}`));
}

