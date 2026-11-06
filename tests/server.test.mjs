import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createApp } from '../server.mjs';

const password = 'test-only-local-password';

async function start(options) {
  const server = createApp(options).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    get: (path, cookie) => fetch(origin + path, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} }),
    post: (path, data, cookie, requestOrigin = origin, accept = 'text/html') => fetch(origin + path, {
      method: 'POST', redirect: 'manual',
      headers: { Origin: requestOrigin, Accept: accept, ...(cookie ? { Cookie: cookie } : {}) },
      body: data instanceof FormData ? data : new URLSearchParams(data),
    }),
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  };
}

test('application validation, idempotency, durable outbox, and protected admin', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dealate-server-test-'));
  const dbPath = join(dir, 'site.sqlite');
  const email = { key: 'test-key', from: 'Dealatecorp <training@example.test>', to: 'admissions@example.test' };
  const attempted = [];
  let app = await start({
    dbPath, email, adminPassword: password,
    deliver: async (key, payload, id) => {
      assert.equal(key, email.key);
      attempted.push({ payload, id });
      return new Response(null, { status: 503 });
    },
  });
  async function until(predicate) {
    for (let i = 0; i < 80; i++) {
      if (predicate()) return;
      await sleep(25);
    }
    assert.fail('The email queue did not reach the expected state.');
  }
  try {
    const { get, post } = app;
    assert.equal((await get('/')).status, 200);
    assert.equal((await get('/media/courses')).status, 404);
    assert.match(await (await get('/admin/applications')).text(), /Admin sign in/);
    assert.equal((await post('/admin/applications/status', {})).status, 401);
    const form = await get('/apply?course=python&track=advanced');
    assert.equal(form.headers.get('cache-control'), 'no-store');
    assert.match(form.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    const html = await form.text();
    assert.match(html, /value="python" selected/);
    assert.match(html, /value="advanced" selected/);
    const requestId = html.match(/name="requestId" value="([^"]+)"/)[1];
    const values = { requestId, name: 'Test <Student>', email: 'student@example.test', college: 'Example College', phone: '+91 80000 00000', course: 'python', track: 'advanced' };
    assert.equal((await post('/apply', values, '', 'https://other.example')).status, 403);
    assert.equal((await post('/apply', { ...values, track: 'bogus' })).status, 422);
    assert.equal((await post('/apply', { ...values, email: 'a?subject=bad@example' })).status, 422);
    const missingPhone = await post('/apply', { ...values, phone: '' }, '', undefined, 'application/json');
    assert.equal(missingPhone.status, 422);
    assert.equal((await missingPhone.json()).message, 'Enter a valid phone number.');
    const submitted = await post('/apply', values);
    assert.equal(submitted.status, 303);
    const receipt = submitted.headers.get('location');
    assert.match(await (await get(receipt)).text(), /Application received/);
    assert.equal((await post('/apply', values)).headers.get('location'), receipt);
    const modalReceipt = await post('/apply', values, '', undefined, 'application/json');
    assert.equal(modalReceipt.status, 201);
    assert.equal((await modalReceipt.json()).reference, new URL(receipt, 'http://localhost').searchParams.get('reference'));
    assert.equal((await post('/apply', { ...values, name: 'Another Student' })).status, 409);
    await until(() => attempted.length === 2);

    assert.equal((await post('/admin/login', { password: 'incorrect' })).status, 401);
    const auth = await post('/admin/login', { password });
    assert.equal(auth.status, 303);
    const header = auth.headers.get('set-cookie');
    assert.match(header, /HttpOnly; SameSite=Strict/);
    const cookie = header.split(';')[0];
    const queue = await (await get('/admin/applications', cookie)).text();
    assert.match(queue, /Test &lt;Student&gt;/);
    assert.match(queue, /Email pending/);
    assert.doesNotMatch(await (await get('/')).text(), /student@example\.test/);
    assert.doesNotMatch(await (await get('/admin/applications')).text(), /student@example\.test/);

    const bad = new FormData();
    bad.set('name', 'Unsafe certificate');
    bad.set('image', new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'disguised.png', { type: 'image/png' }));
    assert.equal((await post('/admin/certificates/save', bad, cookie)).status, 422);
    assert.equal((await post('/admin/courses/delete', { id: 'python', revision: '1' }, cookie)).status, 422);
    assert.equal((await post('/admin/courses/delete', { id: 'python', revision: '1', confirm: 'yes' }, cookie)).status, 303);
    assert.match(await (await get('/admin/applications', cookie)).text(), /Python Programming/);
    assert.equal((await post('/admin/logout', {}, cookie)).status, 303);
    assert.doesNotMatch(await (await get('/admin/applications', cookie)).text(), /student@example\.test/);

    await app.close();
    app = null;
    const db = new DatabaseSync(dbPath);
    try {
      assert.equal(db.prepare('SELECT COUNT(*) AS count FROM applications').get().count, 1);
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM outbox WHERE state = 'pending'").get().count, 2);
      db.exec('UPDATE outbox SET next_attempt = 0');
    } finally {
      db.close();
    }
    const retried = [];
    app = await start({
      dbPath, email: { ...email, to: 'different@example.test' }, adminPassword: password,
      deliver: async (_key, payload, id) => {
        retried.push({ payload, id });
        return new Response(null, { status: 200 });
      },
    });
    await until(() => retried.length === 2);
    assert.deepEqual(retried, attempted);
    assert.equal((await app.get(receipt)).status, 200);
    assert.doesNotMatch(await (await app.get('/')).text(), /data-course="python"/);
    const reader = new DatabaseSync(dbPath);
    try {
      assert.equal(reader.prepare("SELECT COUNT(*) AS count FROM outbox WHERE state = 'sent'").get().count, 2);
    } finally {
      reader.close();
    }
  } finally {
    if (app) await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

