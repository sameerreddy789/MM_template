// Run only against the local Firestore emulator. Razorpay and email are substitutes.
// This file never loads .env or a service-account key, charges a card, or sends mail.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { createRegistrationService, RegistrationError } = require('./services/registration');
const { sendPendingEntryPasses } = require('./services/emailQueue');

const projectId = 'demo-mohana-mantra';
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '';
const config = {
  RAZORPAY_KEY_ID: 'rzp_test_isolated',
  RAZORPAY_KEY_SECRET: 'isolated_razorpay_key_secret',
  RAZORPAY_WEBHOOK_SECRET: 'isolated_webhook_signing_secret',
  JWT_SECRET: 'isolated_ticket_signing_secret_more_than_32_chars',
};
const student = {
  name: 'Local Firebase Test', email: 'firebase.test@example.invalid',
  phone: '9999999999', college: 'Local Test College', roll_no: 'LOCAL-TEST',
};

async function run() {
  assert.match(emulatorHost, /^(127\.0\.0\.1|localhost|\[::1\]):\d+$/,
    'Set FIRESTORE_EMULATOR_HOST to a loopback address. Production access is prohibited.');
  const app = initializeApp({ projectId }, 'registration-emulator-tests');
  const db = getFirestore(app);
  const orders = new Map();
  const payments = new Map();
  const mailAttempts = new Map();
  const sentMail = new Map();
  const failedMail = new Set();
  let passed = 0;
  const dependencies = {
    db, config,
    razorpay: {
      orders: {
        async create(options) {
          const order = { ...options, id: `order_${crypto.randomUUID().replace(/-/g, '')}`, status: 'created', amount_paid: 0 };
          orders.set(order.id, order);
          return { ...order };
        },
        async fetch(id) { assert.ok(orders.has(id)); return { ...orders.get(id) }; },
      },
      payments: { async fetch(id) { assert.ok(payments.has(id)); return { ...payments.get(id) }; } },
    },
    serverTimestamp: () => FieldValue.serverTimestamp(),
    emailConfigured: () => true,
    generateTicketId: () => `MM26-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    sendTicketEmail: async record => {
      mailAttempts.set(record.orderId, (mailAttempts.get(record.orderId) || 0) + 1);
      if (failedMail.has(record.orderId)) throw new Error('Simulated mail failure');
      await new Promise(resolve => setTimeout(resolve, 40));
      sentMail.set(record.orderId, (sentMail.get(record.orderId) || 0) + 1);
    },
  };
  const service = createRegistrationService(dependencies);
  async function check(name, test) {
    await test();
    passed++;
    console.log(`PASS: ${name}`);
  }
  async function preparePaidOrder() {
    const order = await service.createOrder(student);
    Object.assign(orders.get(order.order_id), { status: 'paid', amount_paid: 100000 });
    const payment = {
      id: `pay_${crypto.randomUUID().replace(/-/g, '')}`, order_id: order.order_id,
      amount: 100000, currency: 'INR', status: 'captured', captured: true, amount_refunded: 0,
    };
    payments.set(payment.id, payment);
    const proof = {
      razorpay_order_id: order.order_id, razorpay_payment_id: payment.id,
      razorpay_signature: crypto.createHmac('sha256', config.RAZORPAY_KEY_SECRET)
        .update(`${order.order_id}|${payment.id}`).digest('hex'),
    };
    return { order, payment, proof };
  }
  async function webhook(event, payment) {
    const raw = Buffer.from(JSON.stringify({ event, payload: { payment: { entity: payment } } }));
    const signature = crypto.createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
    return service.processWebhook(raw, signature, JSON.parse(raw.toString()));
  }
  const ticketsFor = orderId => db.collection('registrations').where('orderId', '==', orderId).get();

  try {
    let initialOrder;
    await check('Firebase Admin persists pending student details and server timestamps', async () => {
      initialOrder = await service.createOrder(student);
      const record = (await db.collection('registrationOrders').doc(initialOrder.order_id).get()).data();
      assert.equal(record.student.email, student.email);
      assert.equal(record.student.rollNo, student.roll_no);
      assert.equal(record.amount, 100000);
      assert.equal(record.paymentStatus, 'Pending');
      assert.ok(record.createdAt.toMillis() > 0);
      assert.equal((await ticketsFor(initialOrder.order_id)).size, 0);
    });
    await check('Firestore rules deny browser reads of student details and forged writes', async () => {
      const base = `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents`;
      const read = await fetch(`${base}/registrationOrders/${initialOrder.order_id}`);
      assert.equal(read.status, 403);
      const write = await fetch(`${base}/registrations?documentId=MM26-CLIENT`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fields: { paymentStatus: { stringValue: 'Paid' } } }),
      });
      assert.equal(write.status, 403);
      assert.equal((await db.collection('registrations').doc('MM26-CLIENT').get()).exists, false);
    });
    await check('A captured payment creates a paid ticket in a real Firestore transaction', async () => {
      const { order, proof } = await preparePaidOrder();
      const result = await service.verifyCheckout(proof);
      assert.equal(result.registration.paymentStatus, 'Paid');
      assert.equal(result.registration.emailStatus, 'Sent');
      assert.equal(result.registration.secureToken, undefined);
      const tickets = await ticketsFor(order.order_id);
      assert.equal(tickets.size, 1);
      assert.match(tickets.docs[0].data().secureToken, /^[a-f0-9]{32}$/);
      const storedOrder = (await db.collection('registrationOrders').doc(order.order_id).get()).data();
      assert.equal(storedOrder.ticketId, result.registration.ticketId);
      assert.equal(storedOrder.paymentStatus, 'Paid');
    });
    await check('Concurrent callbacks and both webhook events produce one ticket and mail attempt', async () => {
      const { order, payment, proof } = await preparePaidOrder();
      const results = await Promise.allSettled([
        service.verifyCheckout(proof), webhook('payment.captured', payment),
        webhook('order.paid', payment), service.verifyCheckout(proof),
      ]);
      for (const result of results) {
        if (result.status === 'fulfilled') assert.equal(result.value.success, true);
        else {
          assert.ok(result.reason instanceof RegistrationError);
          assert.equal(result.reason.code, 'CONFIRMATION_PENDING');
        }
      }
      assert.equal((await service.verifyCheckout(proof)).registration.emailStatus, 'Sent');
      assert.equal((await ticketsFor(order.order_id)).size, 1);
      assert.equal(mailAttempts.get(order.order_id), 1);
      assert.equal(sentMail.get(order.order_id), 1);
    });
    await check('Failed email stays recorded with the paid ticket and retries without another ticket', async () => {
      const { order, payment, proof } = await preparePaidOrder();
      failedMail.add(order.order_id);
      const first = await service.verifyCheckout(proof);
      assert.equal(first.registration.paymentStatus, 'Paid');
      assert.equal(first.registration.emailStatus, 'Failed');
      failedMail.delete(order.order_id);
      const retried = await webhook('payment.captured', payment);
      assert.equal(retried.registration.ticketId, first.registration.ticketId);
      assert.equal(retried.registration.emailStatus, 'Sent');
      assert.equal((await ticketsFor(order.order_id)).size, 1);
      assert.equal(mailAttempts.get(order.order_id), 2);
      assert.equal(sentMail.get(order.order_id), 1);
    });
    await check('Underpayment cannot become a paid Firebase registration', async () => {
      const { order, payment, proof } = await preparePaidOrder();
      payment.amount = 100;
      await assert.rejects(service.verifyCheckout(proof), error => error.code === 'PAYMENT_MISMATCH');
      assert.equal((await ticketsFor(order.order_id)).size, 0);
      assert.equal((await db.collection('registrationOrders').doc(order.order_id).get()).data().paymentStatus, 'Pending');
      assert.equal(mailAttempts.has(order.order_id), false);
    });
    await check('The local mail sender consumes the paid queue and skips an unpaid record', async () => {
      config.TICKET_EMAIL_MODE = 'external';
      const { order, proof } = await preparePaidOrder();
      assert.equal((await service.verifyCheckout(proof)).registration.emailStatus, 'Pending');
      assert.equal(mailAttempts.has(order.order_id), false);
      const unpaidRef = db.collection('registrations').doc('unpaid-email-queue-test');
      await unpaidRef.create({ paymentStatus: 'Pending', emailStatus: 'Pending' });
      const localSender = createRegistrationService({ ...dependencies, config: { ...config, TICKET_EMAIL_MODE: 'inline' } });
      const batch = await sendPendingEntryPasses({ db, deliverQueuedEmail: localSender.deliverQueuedEmail });
      assert.equal(batch.sent, 1);
      assert.equal(batch.skipped, 1);
      assert.equal((await service.verifyCheckout(proof)).registration.emailStatus, 'Sent');
      assert.equal(mailAttempts.get(order.order_id), 1);
      assert.equal(sentMail.get(order.order_id), 1);
      assert.equal((await unpaidRef.get()).data().emailStatus, 'Pending');
      await unpaidRef.delete();
      delete config.TICKET_EMAIL_MODE;
    });
    console.log(`\nFirestore emulator: ${passed} checks passed.`);
    console.log('Real local Firestore; substituted Razorpay and email. No production writes, charges, or emails.');
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
}

run().catch(error => {
  console.error('Firestore emulator check failed:', error.message);
  process.exitCode = 1;
});
