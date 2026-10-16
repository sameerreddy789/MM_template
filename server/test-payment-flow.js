// Real Express registration routes, isolated provider/database/mail substitutes.
// This test never loads .env, authenticates to Razorpay, or sends an email.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { once } = require('node:events');
const serverPath = path.join(__dirname, 'server.js');
const nativeRequire = createRequire(serverPath);
const express = nativeRequire('express');
const { isConfiguredSecret } = nativeRequire('./services/registration');
const webhookSecret = 'isolated_webhook_signing_secret';
const keySecret = 'isolated_razorpay_key_secret';
const fakeEnv = {};
const baseEnv = {
  PORT: '0', RAZORPAY_KEY_ID: 'rzp_test_isolated', RAZORPAY_KEY_SECRET: keySecret,
  RAZORPAY_WEBHOOK_SECRET: webhookSecret,
  JWT_SECRET: 'isolated_ticket_signing_secret_more_than_32_chars',
  GMAIL_USER: 'sender@example.invalid', GMAIL_APP_PASSWORD: 'isolated_mail_secret',
  FIREBASE_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'isolated-test' }),
  ADMIN_KEY: 'isolated-staff', ADMIN_SECRET: 'isolated-staff-signing-secret',
};
const validForm = { name: 'Gateway Test', email: 'gateway.test@example.invalid', phone: '9999999999', college: 'Gateway Test College', roll_no: 'GW-TEST' };
const state = {};
const results = [];
let server;

function resetState() {
  for (const key of Object.keys(fakeEnv)) delete fakeEnv[key];
  Object.assign(fakeEnv, baseEnv);
  Object.assign(state, {
    tables: { registrations: new Map(), registrationOrders: new Map(), testRegistrations: new Map(), testRegistrationOrders: new Map() },
    orderRequests: [], orderFetches: [], paymentFetches: [], emailAttempts: [], emails: [],
    failWrites: false, failReads: false, failEmail: false, failProvider: false, delayReads: false,
    transactionQueue: Promise.resolve(),
    order: { id: 'order_IsolatedTest', amount: 100000, currency: 'INR', status: 'paid', amount_paid: 100000, notes: {} },
    payment: { id: 'pay_IsolatedTest', order_id: 'order_IsolatedTest', amount: 100000, currency: 'INR', status: 'captured', captured: true, amount_refunded: 0 },
  });
  state.tables.testRegistrationOrders.set(state.order.id, {
    orderId: state.order.id, paymentMode: 'test', amount: 100000, currency: 'INR', paymentStatus: 'Pending',
    student: { name: validForm.name, email: validForm.email, phone: validForm.phone, college: validForm.college, rollNo: validForm.roll_no },
    createdAt: 'isolated-server-timestamp',
  });
}

function snapshot(value) {
  return { exists: value !== undefined, data: () => value === undefined ? undefined : structuredClone(value) };
}
function write(tables, kind, reference, data) {
  const table = tables[reference.collectionName];
  if (kind === 'create' && table.has(reference.id)) throw new Error('Document already exists');
  if (kind === 'update' && !table.has(reference.id)) throw new Error('Document does not exist');
  table.set(reference.id, structuredClone(kind === 'update' ? { ...table.get(reference.id), ...data } : data));
}
const fakeDb = {
  collection(collectionName) {
    assert.ok(['registrations', 'registrationOrders', 'testRegistrations', 'testRegistrationOrders'].includes(collectionName));
    return { doc(id) {
      const reference = { collectionName, id };
      return {
        ...reference,
        async get() {
          if (state.failReads) throw new Error('Simulated Firestore read outage');
          const result = snapshot(state.tables[collectionName].get(id));
          if (state.delayReads) await new Promise(resolve => setTimeout(resolve, 15));
          return result;
        },
        async create(data) { if (state.failWrites) throw new Error('Simulated Firestore write outage'); write(state.tables, 'create', reference, data); },
        async update(data) { if (state.failWrites) throw new Error('Simulated Firestore write outage'); write(state.tables, 'update', reference, data); },
      };
    } };
  },
  runTransaction(run) {
    const task = state.transactionQueue.then(async () => {
      const staged = structuredClone(state.tables);
      const writes = [];
      const transaction = {
        async get(reference) { if (state.failReads) throw new Error('Simulated Firestore read outage'); return snapshot(staged[reference.collectionName].get(reference.id)); },
        create(reference, data) { writes.push(['create', reference, data]); },
        update(reference, data) { writes.push(['update', reference, data]); },
      };
      const result = await run(transaction);
      if (writes.length && state.failWrites) throw new Error('Simulated Firestore write outage');
      for (const [kind, reference, data] of writes) write(staged, kind, reference, data);
      state.tables = staged;
      return result;
    });
    state.transactionQueue = task.catch(() => {});
    return task;
  },
};

class FakeRazorpay {
  constructor() {
    this.orders = {
      async create(options) {
        state.orderRequests.push(structuredClone(options));
        state.order = { id: 'order_IsolatedCreated', status: 'created', amount_paid: 0, ...options };
        return structuredClone(state.order);
      },
      async fetch(id) {
        state.orderFetches.push(id);
        if (state.failProvider || id !== state.order.id) throw new Error('Simulated provider outage or unknown order');
        return structuredClone(state.order);
      },
    };
    this.payments = { async fetch(id) {
      state.paymentFetches.push(id);
      if (state.failProvider || id !== state.payment.id) throw new Error('Simulated provider outage or unknown payment');
      return structuredClone(state.payment);
    } };
  }
}
function isolatedExpress(...args) {
  const app = express(...args);
  app.listen = (_port, _host, callback) => {
    server = http.createServer(app);
    return server.listen(0, '127.0.0.1', callback);
  };
  return app;
}
Object.assign(isolatedExpress, express);
function isolatedRequire(id) {
  switch (id) {
    case 'express': return isolatedExpress;
    case 'razorpay': return FakeRazorpay;
    case 'dotenv': return { config: () => ({ parsed: {} }) };
    case 'firebase-admin': return { initializeApp() {} };
    case 'firebase-admin/app': return { cert: value => value };
    case 'firebase-admin/firestore': return { getFirestore: () => fakeDb, FieldValue: { serverTimestamp: () => 'isolated-server-timestamp' } };
    case 'fs': return { ...fs, existsSync: () => false };
    case './services/idcard': return { generateIdCard: async () => Buffer.from('isolated-id-card') };
    case './services/qr': return { generateQRCode: async () => Buffer.from('isolated-qr-code') };
    case './services/email': return {
      isEmailConfigured: config => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.GMAIL_USER || '') && isConfiguredSecret(config.GMAIL_APP_PASSWORD),
      sendIdCardEmail: async details => {
        state.emailAttempts.push(details);
        if (state.failEmail) throw new Error('Simulated mail outage');
        await new Promise(resolve => setImmediate(resolve));
        state.emails.push(details);
      },
    };
    default: return nativeRequire(id);
  }
}
async function check(name, run) {
  resetState();
  try { await run(); results.push({ name, passed: true }); console.log(`PASS: ${name}`); }
  catch (error) { results.push({ name, passed: false }); console.error(`FAIL: ${name}\n  ${error.message}`); }
}
async function run() {
  resetState();
  vm.compileFunction(fs.readFileSync(serverPath, 'utf8'), ['require', '__dirname', 'Buffer', 'console', 'process'], { filename: serverPath })(
    isolatedRequire, __dirname, Buffer, { log() {}, warn() {}, error() {} }, { env: fakeEnv });
  if (!server.listening) await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  async function post(endpoint, body, headers = {}) {
    const response = await fetch(`${baseUrl}${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body), signal: AbortSignal.timeout(5000) });
    return { status: response.status, body: await response.json() };
  }
  async function webhook(event = 'payment.captured', overrides = {}, badSignature = false) {
    const body = JSON.stringify({ event, payload: { payment: { entity: { ...state.payment, ...overrides } } } });
    const signature = badSignature ? 'invalid-signature' : crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    return post('/api/payment-webhook', body, { 'x-razorpay-signature': signature });
  }
  async function verify(overrides = {}) {
    const proof = { razorpay_order_id: state.order.id, razorpay_payment_id: state.payment.id,
      razorpay_signature: crypto.createHmac('sha256', keySecret).update(`${state.order.id}|${state.payment.id}`).digest('hex'), ...overrides };
    return post('/api/payment-verify', proof);
  }
  const registrations = () => state.tables.testRegistrations;

  await check('Readiness rejects placeholder payment, webhook, and ticket secrets', async () => {
    for (const key of ['RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET', 'JWT_SECRET']) {
      fakeEnv[key] = 'change_me_placeholder';
      const response = await fetch(`${baseUrl}/api/registration-status`);
      assert.equal((await response.json()).ready, false);
      assert.equal((await post('/api/register', validForm)).status, 503);
      fakeEnv[key] = baseEnv[key];
    }
    assert.equal(state.orderRequests.length, 0);
    assert.equal((await (await fetch(`${baseUrl}/api/registration-status`)).json()).ready, true);
  });
  await check('Invalid student details are rejected before an order or write', async () => {
    for (const details of [null, {}, { ...validForm, email: 'invalid' }, { ...validForm, phone: '123' }, { ...validForm, name: 'A'.repeat(101) }]) {
      assert.equal((await post('/api/register', details)).status, 400);
    }
    assert.equal(state.orderRequests.length, 0);
  });
  await check('Registration closure blocks new orders before any provider request or write', async () => {
    for (const setting of [{ REGISTRATIONS_OPEN: 'false' }, { NODE_ENV: 'production' }]) {
      Object.assign(fakeEnv, setting);
      const status = await (await fetch(`${baseUrl}/api/registration-status`)).json();
      assert.equal(status.registrationsOpen, false);
      assert.equal(status.ready, false);
      const response = await post('/api/register', validForm);
      assert.equal(response.status, 503);
      assert.equal(response.body.code, 'REGISTRATIONS_CLOSED');
      assert.equal(state.orderRequests.length, 0);
      assert.equal(registrations().size, 0);
      delete fakeEnv.REGISTRATIONS_OPEN;
      delete fakeEnv.NODE_ENV;
    }
    fakeEnv.NODE_ENV = 'production';
    fakeEnv.REGISTRATIONS_OPEN = 'true';
    assert.equal((await post('/api/register', validForm)).status, 200);
  });
  await check('Closing registrations preserves confirmation and webhook recovery for existing payments', async () => {
    fakeEnv.REGISTRATIONS_OPEN = 'false';
    const callback = await verify();
    assert.equal(callback.status, 200);
    assert.equal(callback.body.registration.paymentStatus, 'Paid');
    assert.equal((await webhook()).status, 200);
    assert.equal(registrations().size, 1);
    assert.equal(state.emails.length, 1);
    assert.equal(state.orderRequests.length, 0);
  });
  await check('Live registration requires an explicit opening setting', async () => {
    const { createRegistrationService } = nativeRequire('./services/registration');
    const config = { ...baseEnv, PAYMENT_MODE: 'live', RAZORPAY_KEY_ID: 'rzp_live_isolated' };
    const live = createRegistrationService({ db: fakeDb, razorpay: new FakeRazorpay(), config,
      serverTimestamp: () => 'isolated-server-timestamp', emailConfigured: () => true,
      generateTicketId: () => 'MM26-C0FFEE', sendTicketEmail: async () => ({ messageId: 'isolated-message' }) });
    assert.equal(live.configurationStatus().ready, false);
    await assert.rejects(live.createOrder(validForm), error => error.code === 'REGISTRATIONS_CLOSED');
    assert.equal(state.orderRequests.length, 0);
    config.REGISTRATIONS_OPEN = 'true';
    assert.equal(live.configurationStatus().ready, true);
    assert.equal((await live.createOrder(validForm)).paymentMode, 'live');
  });
  await check('A test/live key-mode mismatch disables orders and confirmation', async () => {
    fakeEnv.PAYMENT_MODE = 'live';
    const status = await (await fetch(`${baseUrl}/api/registration-status`)).json();
    assert.equal(status.ready, false);
    assert.equal((await post('/api/register', validForm)).status, 503);
    assert.equal((await verify()).status, 503);
    assert.equal(state.orderRequests.length, 0);
    assert.equal(state.emails.length, 0);
  });
  await check('Test orders and passes stay separate from live registrations', async () => {
    const test = await verify();
    assert.equal(test.body.registration.paymentMode, 'test');
    assert.match(test.body.registration.ticketId, /^MM26-TEST-[A-F0-9]{6}$/);
    assert.equal(state.tables.registrations.size, 0);
    const { createRegistrationService } = nativeRequire('./services/registration');
    const live = createRegistrationService({ db: fakeDb, razorpay: new FakeRazorpay(),
      config: { ...baseEnv, PAYMENT_MODE: 'live', RAZORPAY_KEY_ID: 'rzp_live_isolated', REGISTRATIONS_OPEN: 'true' },
      serverTimestamp: () => 'isolated-server-timestamp', emailConfigured: () => true,
      generateTicketId: () => 'MM26-C0FFEE', sendTicketEmail: async () => ({ messageId: 'isolated-message' }),
    });
    const order = await live.createOrder(validForm);
    assert.equal(order.paymentMode, 'live');
    assert.equal(state.tables.registrationOrders.size, 1);
    assert.equal(state.tables.testRegistrations.size, 1);
    const testProof = { razorpay_order_id: 'order_IsolatedTest', razorpay_payment_id: 'pay_IsolatedTest',
      razorpay_signature: crypto.createHmac('sha256', keySecret).update('order_IsolatedTest|pay_IsolatedTest').digest('hex') };
    await assert.rejects(live.verifyCheckout(testProof), error => error.code === 'UNKNOWN_ORDER');
    state.order.status = 'paid'; state.order.amount_paid = 100000;
    state.payment.order_id = order.order_id;
    const liveProof = { ...testProof, razorpay_order_id: order.order_id,
      razorpay_signature: crypto.createHmac('sha256', keySecret).update(`${order.order_id}|pay_IsolatedTest`).digest('hex') };
    const paid = await live.verifyCheckout(liveProof);
    assert.equal(paid.registration.paymentMode, 'live');
    assert.equal(paid.registration.ticketId, 'MM26-C0FFEE');
    assert.equal(state.tables.registrations.size, 1);
    assert.equal(state.tables.testRegistrations.size, 1);
    assert.equal((await verify(liveProof)).body.code, 'UNKNOWN_ORDER');
  });
  await check('The fixed INR 1000 order and cleaned details are saved as Pending', async () => {
    const response = await post('/api/register', { ...validForm, name: '  Gateway Test  ', email: 'Gateway.Test@EXAMPLE.INVALID', roll_no: 'gw-test', amount: 100, currency: 'USD' });
    assert.equal(response.status, 200);
    assert.equal(response.body.amount, 100000);
    assert.equal(response.body.currency, 'INR');
    assert.equal(state.orderRequests[0].notes.student_name, validForm.name);
    assert.equal(state.orderRequests[0].notes.student_email, validForm.email);
    assert.equal(state.orderRequests[0].notes.roll_no, validForm.roll_no);
    assert.ok(state.orderRequests[0].receipt.length <= 40);
    assert.equal(state.tables.testRegistrationOrders.get(response.body.order_id).paymentStatus, 'Pending');
    assert.equal(state.tables.testRegistrationOrders.get(response.body.order_id).paymentMode, 'test');
    assert.equal(response.body.paymentMode, 'test');
    assert.equal(registrations().size, 0);
    assert.equal(state.emails.length, 0);
  });
  await check('A failed pending-order write cannot offer checkout', async () => {
    state.failWrites = true;
    const response = await post('/api/register', validForm);
    assert.equal(response.status, 503);
    assert.equal(response.body.order_id, undefined);
    assert.equal(registrations().size, 0);
  });
  await check('Invalid webhook and checkout signatures cannot issue tickets', async () => {
    assert.equal((await webhook('payment.captured', {}, true)).status, 400);
    assert.equal((await verify({ razorpay_signature: '0'.repeat(64) })).status, 400);
    assert.equal(state.paymentFetches.length, 0);
    assert.equal(registrations().size, 0);
    assert.equal(state.emails.length, 0);
  });
  await check('A verified captured payment saves a ticket and confirms its email', async () => {
    const response = await verify();
    assert.equal(response.status, 200);
    assert.equal(response.body.registration.paymentStatus, 'Paid');
    assert.equal(response.body.registration.emailStatus, 'Sent');
    assert.equal(response.body.registration.secureToken, undefined);
    assert.equal(registrations().size, 1);
    const record = [...registrations().values()][0];
    assert.match(record.ticketId, /^MM26-TEST-[A-F0-9]{6}$/);
    assert.match(record.secureToken, /^[a-f0-9]{32}$/);
    assert.equal(record.email, validForm.email);
    assert.equal(record.amount, 1000);
    assert.equal(state.emails.length, 1);
  });
  await check('Both webhooks and the checkout callback issue one ticket and email', async () => {
    await Promise.all([webhook('payment.captured'), webhook('order.paid'), verify()]);
    assert.equal((await webhook('payment.captured')).status, 200);
    assert.equal(registrations().size, 1);
    assert.equal(state.emails.length, 1);
  });
  await check('Payments without a server-created stored order are rejected', async () => {
    state.tables.testRegistrationOrders.clear();
    assert.equal((await webhook()).status, 400);
    assert.equal((await verify()).status, 400);
    assert.equal(registrations().size, 0);
    assert.equal(state.emails.length, 0);
  });
  await check('Malformed captured webhook payloads cannot be acknowledged as success', async () => {
    assert.equal((await webhook('payment.captured', { order_id: null })).status, 400);
    const raw = JSON.stringify({ event: 'payment.captured', payload: {} });
    const signature = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');
    assert.equal((await post('/api/payment-webhook', raw, { 'x-razorpay-signature': signature })).status, 400);
    assert.equal(registrations().size, 0);
  });
  await check('Underpayments and wrong currencies never create Paid tickets', async () => {
    assert.equal((await webhook('payment.captured', { amount: 100 })).status, 400);
    state.payment.amount = 100;
    assert.equal((await verify()).status, 400);
    state.payment.amount = 100000;
    state.payment.currency = 'USD';
    assert.equal((await verify()).status, 400);
    assert.equal(registrations().size, 0);
    assert.equal(state.emails.length, 0);
  });
  await check('A payment belonging to a different order is rejected', async () => {
    state.payment.order_id = 'order_DifferentOrder';
    assert.equal((await verify()).status, 400);
    assert.equal(registrations().size, 0);
  });
  await check('Stored order changes are revalidated inside the paid transaction', async () => {
    const originalTransaction = fakeDb.runTransaction;
    fakeDb.runTransaction = function (run) {
      state.tables.testRegistrationOrders.get(state.order.id).amount = 100;
      return originalTransaction.call(this, run);
    };
    try {
      assert.equal((await verify()).status, 400);
      assert.equal(registrations().size, 0);
      assert.equal(state.emails.length, 0);
    } finally {
      fakeDb.runTransaction = originalTransaction;
    }
  });
  await check('An inconsistent paid ticket mapping cannot return confirmed success', async () => {
    const paid = await verify();
    const ticket = state.tables.testRegistrations.get(paid.body.registration.ticketId);
    ticket.paymentId = 'pay_DifferentPayment';
    assert.equal((await verify()).status, 503);
    assert.equal(state.emails.length, 1);
  });
  await check('Authorized payments remain Pending without a ticket or mail', async () => {
    state.payment.status = 'authorized';
    state.payment.captured = false;
    state.order.status = 'attempted';
    state.order.amount_paid = 0;
    const response = await verify();
    assert.equal(response.status, 202);
    assert.equal(response.body.paymentStatus, 'Pending');
    assert.equal((await webhook('payment.authorized')).status, 200);
    assert.equal(registrations().size, 0);
    assert.equal(state.emails.length, 0);
  });
  await check('Refunded payments cannot issue a new registration', async () => {
    state.payment.amount_refunded = 100000;
    assert.equal((await verify()).status, 400);
    assert.equal(registrations().size, 0);
  });
  await check('A Firestore write failure is retryable and recovers one ticket', async () => {
    state.failWrites = true;
    assert.equal((await webhook()).status, 503);
    assert.equal(registrations().size, 0);
    state.failWrites = false;
    assert.equal((await webhook()).status, 200);
    assert.equal(registrations().size, 1);
    assert.equal(state.emails.length, 1);
  });
  await check('A provider outage does not claim successful confirmation', async () => {
    state.failProvider = true;
    assert.equal((await verify()).status, 503);
    assert.equal((await webhook()).status, 503);
    assert.equal(registrations().size, 0);
  });
  await check('An email failure preserves the ticket and retries without duplicates', async () => {
    state.failEmail = true;
    assert.equal((await webhook()).status, 503);
    assert.equal(registrations().size, 1);
    assert.equal([...registrations().values()][0].emailStatus, 'Failed');
    state.failEmail = false;
    assert.equal((await webhook()).status, 200);
    assert.equal((await verify()).body.registration.emailStatus, 'Sent');
    assert.equal(registrations().size, 1);
    assert.equal(state.emailAttempts.length, 2);
    assert.equal(state.emails.length, 1);
  });
  await check('The browser receives Paid status without a false Sent status on mail failure', async () => {
    state.failEmail = true;
    const response = await verify();
    assert.equal(response.status, 200);
    assert.equal(response.body.registration.paymentStatus, 'Paid');
    assert.equal(response.body.registration.emailStatus, 'Failed');
    assert.equal(state.emails.length, 0);
  });
  await check('External email mode queues a paid pass without sending SMTP or retrying a saved webhook', async () => {
    fakeEnv.TICKET_EMAIL_MODE = 'external';
    delete fakeEnv.GMAIL_USER;
    delete fakeEnv.GMAIL_APP_PASSWORD;
    assert.equal((await (await fetch(`${baseUrl}/api/registration-status`)).json()).ready, true);
    const result = await verify();
    assert.equal(result.body.registration.paymentStatus, 'Paid');
    assert.equal(result.body.registration.emailStatus, 'Pending');
    assert.equal((await webhook()).status, 200);
    assert.equal(registrations().size, 1);
    assert.equal(state.emailAttempts.length, 0);
    const record = [...registrations().values()][0];
    record.emailStatus = 'Sent';
    const ticketId = record.ticketId;
    state.tables.testRegistrations.set(ticketId, record);
    assert.equal((await verify()).body.registration.emailStatus, 'Sent');
    assert.equal(state.emailAttempts.length, 0);
  });
  await check('Malformed JSON is rejected before provider work', async () => {
    assert.equal((await post('/api/register', '{')).status, 400);
    assert.equal(state.orderRequests.length, 0);
  });
  const staff = (ticketId, sessionKey) => post('/api/gatekeeper/checkin', {
    adminKey: baseEnv.ADMIN_KEY, adminSecret: baseEnv.ADMIN_SECRET, ticketId, sessionKey,
  });
  const staffVerify = input => post('/api/gatekeeper/verify', {
    adminKey: baseEnv.ADMIN_KEY, adminSecret: baseEnv.ADMIN_SECRET, ...input,
  });
  const sessionKeys = ['day1_am', 'day1_pm', 'day2_am', 'day2_pm'];
  await check('Fresh paid tickets persist all four unchecked sessions', async () => {
    const paid = await verify();
    const record = registrations().get(paid.body.registration.ticketId);
    assert.deepEqual(Object.keys(record.checkInSessions || {}), sessionKeys);
    for (const key of sessionKeys) {
      assert.equal(record.checkInSessions[key].checkedIn, false);
      assert.equal(record.checkInSessions[key].timestamp, null);
      assert.equal(record.checkInSessions[key].gatekeeper, null);
    }
  });
  await check('Admin login identifies the active payment mode and rejects bad credentials', async () => {
    const login = await post('/api/gatekeeper/login', { adminKey: baseEnv.ADMIN_KEY, adminSecret: baseEnv.ADMIN_SECRET });
    assert.equal(login.status, 200);
    assert.equal(login.body.paymentMode, 'test');
    assert.equal((await post('/api/gatekeeper/login', { adminKey: baseEnv.ADMIN_KEY, adminSecret: 'wrong-secret' })).status, 401);
    assert.equal((await post('/api/gatekeeper/verify', { ticketId: 'MM26-TEST-C0FFEE' })).status, 401);
    assert.equal((await post('/api/gatekeeper/checkin', { ticketId: 'MM26-TEST-C0FFEE', sessionKey: 'day1_am' })).status, 401);
  });
  await check('Malformed ticket identifiers are rejected before a database lookup', async () => {
    for (const ticketId of ['wrong/id', 'MM26-C0FFEE', 'MM26-TEST-C0FFEE/other/doc', {}, 7]) {
      assert.equal((await staffVerify({ ticketId })).status, 400);
    }
  });
  await check('All four sessions record staff and time once while preserving earlier sessions', async () => {
    const paid = await verify();
    const ticketId = paid.body.registration.ticketId;
    for (const key of sessionKeys) {
      const entered = await staff(ticketId, key);
      assert.equal(entered.status, 200);
      assert.equal(entered.body.sessionKey, key);
      assert.equal(entered.body.checkInSessions[key].gatekeeper, baseEnv.ADMIN_KEY);
      assert.ok(!Number.isNaN(Date.parse(entered.body.checkInSessions[key].timestamp)));
      const before = structuredClone(registrations().get(ticketId).checkInSessions);
      const repeated = await staff(ticketId, key);
      assert.equal(repeated.status, 400);
      assert.equal(repeated.body.code, 'ALREADY_CHECKED_IN');
      assert.deepEqual(registrations().get(ticketId).checkInSessions, before);
    }
    assert.ok(sessionKeys.every(key => registrations().get(ticketId).checkInSessions[key].checkedIn));
  });
  await check('Concurrent scans admit a paid ticket once in the same session', async () => {
    const paid = await verify();
    state.delayReads = true;
    const checks = await Promise.all([staff(paid.body.registration.ticketId, 'day1_am'), staff(paid.body.registration.ticketId, 'day1_am')]);
    assert.deepEqual(checks.map(result => result.status).sort(), [200, 400]);
    assert.equal(registrations().get(paid.body.registration.ticketId).checkInSessions.day1_am.checkedIn, true);
  });
  await check('Concurrent different-session scans preserve both check-ins', async () => {
    const paid = await verify();
    state.delayReads = true;
    const checks = await Promise.all([staff(paid.body.registration.ticketId, 'day1_am'), staff(paid.body.registration.ticketId, 'day1_pm')]);
    assert.ok(checks.every(result => result.status === 200));
    const sessions = registrations().get(paid.body.registration.ticketId).checkInSessions;
    assert.equal(sessions.day1_am.checkedIn, true);
    assert.equal(sessions.day1_pm.checkedIn, true);
  });
  await check('Unpaid passes and unknown session names cannot be checked in', async () => {
    const paid = await verify();
    const ticketId = paid.body.registration.ticketId;
    assert.equal((await staff(ticketId, 'unknown-session')).status, 400);
    registrations().get(ticketId).paymentStatus = 'Pending';
    assert.equal((await staff(ticketId, 'day1_am')).status, 400);
  });
  await check('Legitimate staff verification is not limited to ten gate requests', async () => {
    const paid = await verify();
    for (let i = 0; i < 12; i++) {
      const result = await post('/api/gatekeeper/verify', { adminKey: baseEnv.ADMIN_KEY,
        adminSecret: baseEnv.ADMIN_SECRET, ticketId: paid.body.registration.ticketId });
      assert.equal(result.status, 200);
    }
  });
  await check('Health monitors do not consume the public API request budget', async () => {
    const before = await fetch(`${baseUrl}/api/registration-status`);
    assert.equal(before.status, 200);
    assert.ok(before.headers.has('ratelimit-remaining'));
    const remaining = Number(before.headers.get('ratelimit-remaining'));
    await before.json();
    for (let i = 0; i < 201; i++) {
      const response = await fetch(`${baseUrl}/api/health`);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, 'healthy');
    }
    const head = await fetch(`${baseUrl}/api/health`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.has('ratelimit-limit'), false);
    const after = await fetch(`${baseUrl}/api/registration-status`);
    assert.equal(after.status, 200);
    assert.equal(Number(after.headers.get('ratelimit-remaining')), remaining - 1);
    await after.json();
    assert.equal(state.orderRequests.length, 0);
    assert.equal(state.emailAttempts.length, 0);
  });
  await check('Health stays available when the public API rate limit is exhausted', async () => {
    const initial = await fetch(`${baseUrl}/api/registration-status`);
    assert.equal(initial.status, 200);
    const remaining = Number(initial.headers.get('ratelimit-remaining'));
    await initial.json();
    for (let i = 0; i < remaining; i++) {
      const response = await fetch(`${baseUrl}/api/registration-status`);
      assert.equal(response.status, 200);
      await response.json();
    }
    const limited = await fetch(`${baseUrl}/api/registration-status`);
    assert.equal(limited.status, 429);
    await limited.json();
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'healthy');
    const unsupportedMethod = await fetch(`${baseUrl}/api/health`, { method: 'POST' });
    assert.equal(unsupportedMethod.status, 429);
    await unsupportedMethod.json();
    assert.equal(state.orderRequests.length, 0);
    assert.equal(state.emailAttempts.length, 0);
  });
}

run().catch(error => { console.error('Payment route test could not run:', error.message); process.exitCode = 1; }).finally(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  const failed = results.filter(result => !result.passed).length;
  console.log(`\nIsolated payment route tests: ${results.length - failed} passed, ${failed} failed.`);
  console.log('Provider, Firestore, and SMTP were substituted; no real payment, registration, or email occurred.');
  if (failed) process.exitCode = 1;
});
