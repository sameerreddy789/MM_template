const crypto = require("node:crypto");
const { paymentEnvironment, recordMatchesMode } = require("./paymentEnvironment");
const { createCheckInSessions } = require("./checkInSessions");

const REGISTRATION_AMOUNT = 100000;
const REGISTRATION_CURRENCY = "INR";
const placeholderPattern = /dummy|placeholder|your[_ -]|change[_ -]?me|replace[_ -]?me|<[^>]+>/i;

class RegistrationError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function isConfiguredSecret(value, minimumLength = 16) {
  return typeof value === "string" && value.trim().length >= minimumLength &&
    !placeholderPattern.test(value);
}

function validId(value, prefix) {
  return typeof value === "string" &&
    new RegExp(`^${prefix}_[A-Za-z0-9_]{1,64}$`).test(value);
}

function verifySignature(signature, payload, secret) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

function hasValidRegistrationPaymentAmount(payment) {
  const amount = payment?.amount;
  const fee = payment?.fee ?? 0;
  const tax = payment?.tax ?? 0;
  if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(fee) || !Number.isSafeInteger(tax) ||
    amount < REGISTRATION_AMOUNT || fee < 0 || fee > amount || tax < 0 || tax > fee) return false;
  // Razorpay keeps the order at the registration price when the customer pays
  // its checkout fee. The payment total then includes fee (which includes GST).
  // Merchant-paid fees leave the customer's payment at the registration price.
  return amount === REGISTRATION_AMOUNT || amount - REGISTRATION_AMOUNT === fee;
}

function cleanStudentDetails(input) {
  const text = (key) => typeof input?.[key] === "string" ? input[key].trim() : "";
  const student = {
    name: text("name"),
    email: text("email").toLowerCase(),
    phone: text("phone").replace(/[\s\-()]/g, ""),
    college: text("college"),
    rollNo: text("roll_no").toUpperCase(),
  };
  if (Object.values(student).some(value => !value)) {
    throw new RegistrationError(400, "INVALID_DETAILS", "Please complete all five student fields.");
  }
  if (student.name.length > 100 || student.college.length > 150 || student.rollNo.length > 50) {
    throw new RegistrationError(400, "INVALID_DETAILS", "One or more student details are too long.");
  }
  if (student.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    throw new RegistrationError(400, "INVALID_EMAIL", "Please enter a valid email address.");
  }
  if (!/^\+?[0-9]{10,15}$/.test(student.phone)) {
    throw new RegistrationError(400, "INVALID_PHONE", "Please enter a valid mobile number.");
  }
  return student;
}

function validateStoredOrder(order, orderId, mode) {
  if (!order || order.orderId !== orderId || order.amount !== REGISTRATION_AMOUNT ||
    order.currency !== REGISTRATION_CURRENCY || !["Pending", "Paid"].includes(order.paymentStatus) ||
    !recordMatchesMode(order, mode)) {
    throw new RegistrationError(400, "INVALID_ORDER", "This registration order could not be validated.");
  }
  try {
    return cleanStudentDetails({ ...order.student, roll_no: order.student?.rollNo });
  } catch {
    throw new RegistrationError(400, "INVALID_ORDER", "The student details for this payment order could not be validated.");
  }
}

function createRegistrationService({ db, razorpay, config, serverTimestamp, sendTicketEmail, emailConfigured, generateTicketId }) {
  const environment = paymentEnvironment(config);
  function configurationStatus() {
    const payment = Boolean(razorpay) && paymentEnvironment(config).keyMatchesMode &&
      paymentEnvironment(config).mode === environment.mode &&
      isConfiguredSecret(config.RAZORPAY_KEY_SECRET);
    const status = {
      registrationsOpen: (environment.mode !== "test" || config.NODE_ENV !== "production") &&
        (config.REGISTRATIONS_OPEN === "true" ||
          (config.REGISTRATIONS_OPEN === undefined && environment.mode === "test" && config.NODE_ENV !== "production")),
      payment,
      database: Boolean(db),
      webhook: isConfiguredSecret(config.RAZORPAY_WEBHOOK_SECRET),
      tickets: isConfiguredSecret(config.JWT_SECRET, 32),
      email: config.TICKET_EMAIL_MODE === "external" || emailConfigured(config),
    };
    return { ...status, ready: Object.values(status).every(Boolean) };
  }

  function requirePaymentBackend() {
    const status = configurationStatus();
    if (!status.payment || !status.database) {
      throw new RegistrationError(503, "PAYMENTS_UNAVAILABLE", "Payments are temporarily unavailable. Please try again shortly.");
    }
  }

  async function createOrder(input) {
    if (!configurationStatus().registrationsOpen) {
      throw new RegistrationError(503, "REGISTRATIONS_CLOSED", "Registrations are temporarily closed while we update the registration system.");
    }
    const student = cleanStudentDetails(input);
    if (!configurationStatus().ready) {
      throw new RegistrationError(503, "PAYMENTS_UNAVAILABLE", "Payments are temporarily unavailable. Please try again shortly.");
    }
    let order;
    try {
      order = await razorpay.orders.create({
        amount: REGISTRATION_AMOUNT,
        currency: REGISTRATION_CURRENCY,
        receipt: `mm26_${crypto.randomUUID().replace(/-/g, "")}`,
        notes: {
          student_name: student.name,
          student_email: student.email,
          student_phone: student.phone,
          college_name: student.college,
          roll_no: student.rollNo,
          fest: "MohanaMantra 2K26",
          payment_mode: environment.mode,
        },
      });
    } catch {
      throw new RegistrationError(503, "ORDER_UNAVAILABLE", "We couldn't create your payment order. Please try again shortly.");
    }
    if (!validId(order.id, "order") || order.amount !== REGISTRATION_AMOUNT || order.currency !== REGISTRATION_CURRENCY) {
      throw new RegistrationError(502, "INVALID_ORDER", "The payment order could not be validated. Please try again.");
    }
    try {
      // Checkout is offered only after the order and student details are durable.
      await db.collection(environment.ordersCollection).doc(order.id).create({
        orderId: order.id,
        paymentMode: environment.mode,
        student,
        amount: REGISTRATION_AMOUNT,
        currency: REGISTRATION_CURRENCY,
        paymentStatus: "Pending",
        createdAt: serverTimestamp(),
      });
    } catch {
      throw new RegistrationError(503, "REGISTRATION_UNAVAILABLE", "We couldn't save your registration details. Please try again before paying.");
    }
    return { success: true, order_id: order.id, amount: order.amount, currency: order.currency,
      key_id: config.RAZORPAY_KEY_ID, paymentMode: environment.mode };
  }

  async function readStoredOrder(orderId) {
    const reference = db.collection(environment.ordersCollection).doc(orderId);
    let snapshot;
    try {
      snapshot = await reference.get();
    } catch {
      throw new RegistrationError(503, "REGISTRATION_UNAVAILABLE", "Payment confirmation is temporarily unavailable. Keep your receipt and try again.");
    }
    if (!snapshot.exists) {
      throw new RegistrationError(400, "UNKNOWN_ORDER", "This payment order was not created for an MM registration.");
    }
    const order = snapshot.data();
    validateStoredOrder(order, orderId, environment.mode);
    return { reference, order };
  }

  async function fetchCapturedPayment(orderId, paymentId) {
    let order, payment;
    try {
      [order, payment] = await Promise.all([razorpay.orders.fetch(orderId), razorpay.payments.fetch(paymentId)]);
    } catch {
      throw new RegistrationError(503, "VERIFICATION_UNAVAILABLE", "Payment confirmation is temporarily unavailable. Keep your receipt and try again.");
    }
    if (order.id !== orderId || payment.id !== paymentId || payment.order_id !== orderId ||
      order.amount !== REGISTRATION_AMOUNT || !Number.isSafeInteger(payment.amount) || payment.amount < REGISTRATION_AMOUNT ||
      (payment.status === "captured" && !hasValidRegistrationPaymentAmount(payment)) ||
      order.currency !== REGISTRATION_CURRENCY || payment.currency !== REGISTRATION_CURRENCY ||
      Number(payment.amount_refunded || 0) !== 0) {
      throw new RegistrationError(400, "PAYMENT_MISMATCH", "The payment does not match this registration and its required fee.");
    }
    if (payment.status === "failed" || payment.status === "refunded") {
      throw new RegistrationError(409, "PAYMENT_INCOMPLETE", "This payment has not completed. Please check your Razorpay receipt.");
    }
    if (payment.status !== "captured" || payment.captured === false || order.status !== "paid" || order.amount_paid !== REGISTRATION_AMOUNT) {
      return null;
    }
    return payment;
  }

  async function savePaidRegistration(orderReference, payment) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const ticketId = generateTicketId(environment.mode);
      const ticketReference = db.collection(environment.registrationsCollection).doc(ticketId);
      try {
        return await db.runTransaction(async transaction => {
          const orderSnapshot = await transaction.get(orderReference);
          if (!orderSnapshot.exists) throw new RegistrationError(400, "UNKNOWN_ORDER", "This registration order could not be found.");
          const order = orderSnapshot.data();
          const student = validateStoredOrder(order, orderReference.id, environment.mode);
          if (order.paymentId && order.paymentId !== payment.id) {
            throw new RegistrationError(409, "PAYMENT_CONFLICT", "This order already has a confirmed registration.");
          }
          if (order.ticketId) {
            const existingReference = db.collection(environment.registrationsCollection).doc(order.ticketId);
            const existingSnapshot = await transaction.get(existingReference);
            if (!existingSnapshot.exists) throw new Error("Registration mapping is incomplete");
            const record = existingSnapshot.data();
            if (record.ticketId !== order.ticketId || record.orderId !== order.orderId || record.paymentId !== payment.id ||
              record.paymentStatus !== "Paid" || record.amountPaise !== REGISTRATION_AMOUNT || record.currency !== REGISTRATION_CURRENCY ||
              (record.paymentAmountPaise !== undefined && record.paymentAmountPaise !== payment.amount) ||
              (record.checkoutFeePaise !== undefined && record.checkoutFeePaise !== payment.amount - REGISTRATION_AMOUNT) ||
              !recordMatchesMode(record, environment.mode)) {
              throw new Error("Registration mapping does not match its payment");
            }
            return { reference: existingReference, record };
          }
          if (order.paymentStatus === "Paid" || order.paymentId) throw new Error("Paid registration mapping is incomplete");
          const ticketSnapshot = await transaction.get(ticketReference);
          if (ticketSnapshot.exists) throw new RegistrationError(409, "TICKET_COLLISION", "Please retry payment confirmation.");
          const record = {
            ticketId,
            paymentMode: environment.mode,
            ...student,
            orderId: order.orderId,
            paymentId: payment.id,
            amount: REGISTRATION_AMOUNT / 100,
            amountPaise: REGISTRATION_AMOUNT,
            paymentAmountPaise: payment.amount,
            checkoutFeePaise: payment.amount - REGISTRATION_AMOUNT,
            currency: REGISTRATION_CURRENCY,
            paymentStatus: "Paid",
            checkInStatus: "Not Checked In",
            checkInSessions: createCheckInSessions(),
            checkedInAt: null,
            secureToken: crypto.randomBytes(16).toString("hex"),
            emailStatus: "Pending",
            emailLeaseUntil: 0,
            createdAt: serverTimestamp(),
          };
          transaction.create(ticketReference, record);
          transaction.update(orderReference, {
            ticketId,
            paymentId: payment.id,
            paymentStatus: "Paid",
            paymentAmountPaise: payment.amount,
            checkoutFeePaise: payment.amount - REGISTRATION_AMOUNT,
            paidAt: serverTimestamp(),
          });
          return { reference: ticketReference, record };
        });
      } catch (error) {
        if (error.code === "TICKET_COLLISION") continue;
        if (error instanceof RegistrationError) throw error;
        throw new RegistrationError(503, "REGISTRATION_UNAVAILABLE", "Your payment could not be recorded yet. Keep your receipt and retry confirmation; do not pay again.");
      }
    }
    throw new RegistrationError(503, "REGISTRATION_UNAVAILABLE", "Your entry pass could not be issued yet. Keep your receipt and retry confirmation.");
  }

  async function deliverEmail(reference) {
    const attemptId = crypto.randomUUID();
    let claim;
    try {
      claim = await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        const record = snapshot.data();
        if (!record || record.paymentStatus !== "Paid" || record.amountPaise !== REGISTRATION_AMOUNT ||
          record.currency !== REGISTRATION_CURRENCY || !validId(record.paymentId, "pay") ||
          !recordMatchesMode(record, environment.mode)) {
          throw new Error("Only confirmed paid registrations can receive an entry-pass email");
        }
        if (record.emailStatus === "Sent") return { status: "Sent" };
        // A local Google mail sender can consume this durable queue.
        // In external mode the payment server never sends a second email.
        if (config.TICKET_EMAIL_MODE === "external") return { status: record.emailStatus };
        if (record.emailStatus === "Sending" && record.emailLeaseUntil > Date.now()) return { status: "Sending" };
        const status = configurationStatus();
        if (!status.email || !status.tickets) return { status: "Pending" };
        transaction.update(reference, {
          emailStatus: "Sending",
          emailAttemptId: attemptId,
          emailLeaseUntil: Date.now() + 60000,
          emailLastAttemptAt: serverTimestamp(),
        });
        return { record };
      });
    } catch {
      throw new RegistrationError(503, "EMAIL_STATUS_UNAVAILABLE", "Your registration is recorded, but its email status is temporarily unavailable.");
    }
    if (claim.status) return claim.status;
    let status = "Sent";
    let delivery;
    let failureCode;
    try {
      delivery = await sendTicketEmail(claim.record);
    } catch (error) {
      status = "Failed";
      failureCode = /^[A-Z0-9_]{1,50}$/.test(String(error.code || "")) ? error.code : "DELIVERY_FAILED";
    }
    try {
      return await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        const record = snapshot.data();
        if (record.emailAttemptId !== attemptId) return record.emailStatus;
        transaction.update(reference, {
          emailStatus: status,
          emailLeaseUntil: 0,
          emailFailureCode: failureCode || null,
          ...(status === "Sent" ? { emailSentAt: serverTimestamp(),
            ...(typeof delivery?.messageId === "string" ? { emailMessageId: delivery.messageId } : {}) } : {}),
        });
        return status;
      });
    } catch {
      throw new RegistrationError(503, "EMAIL_STATUS_UNAVAILABLE", "Your registration is recorded, but its email status is temporarily unavailable.");
    }
  }

  async function confirmPayment(orderId, paymentId) {
    const stored = await readStoredOrder(orderId);
    const payment = await fetchCapturedPayment(orderId, paymentId);
    if (!payment) return { success: false, paymentStatus: "Pending", order_id: orderId };
    const { reference, record } = await savePaidRegistration(stored.reference, payment);
    const emailStatus = await deliverEmail(reference);
    return {
      success: true,
      registration: {
        ticketId: record.ticketId,
        name: record.name,
        email: record.email,
        paymentId: record.paymentId,
        amount: record.amount,
        paymentAmountPaise: record.paymentAmountPaise ?? payment.amount,
        checkoutFeePaise: record.checkoutFeePaise ?? payment.amount - REGISTRATION_AMOUNT,
        paymentStatus: record.paymentStatus,
        paymentMode: environment.mode,
        emailStatus,
      },
    };
  }

  async function verifyCheckout(input) {
    requirePaymentBackend();
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = input || {};
    if (!validId(orderId, "order") || !validId(paymentId, "pay")) {
      throw new RegistrationError(400, "INVALID_PROOF", "The payment confirmation is incomplete. Keep your receipt and retry confirmation.");
    }
    const { order } = await readStoredOrder(orderId);
    if (!verifySignature(signature, `${order.orderId}|${paymentId}`, config.RAZORPAY_KEY_SECRET)) {
      throw new RegistrationError(400, "INVALID_SIGNATURE", "The payment confirmation could not be verified.");
    }
    return confirmPayment(orderId, paymentId);
  }

  async function processWebhook(rawBody, signature, body, eventId) {
    if (!isConfiguredSecret(config.RAZORPAY_WEBHOOK_SECRET)) {
      throw new RegistrationError(503, "WEBHOOK_UNAVAILABLE", "Payment notifications are temporarily unavailable.");
    }
    if (!rawBody || !verifySignature(signature, rawBody, config.RAZORPAY_WEBHOOK_SECRET)) {
      throw new RegistrationError(400, "INVALID_SIGNATURE", "Invalid webhook signature.");
    }
    if (!["payment.captured", "order.paid"].includes(body?.event)) return { ignored: true };
    requirePaymentBackend();
    const payment = body?.payload?.payment?.entity;
    if (!payment || !validId(payment.id, "pay") || !validId(payment.order_id, "order") ||
      payment.status !== "captured" || !hasValidRegistrationPaymentAmount(payment) || payment.currency !== REGISTRATION_CURRENCY) {
      throw new RegistrationError(400, "INVALID_PAYMENT", "The webhook payment does not match a captured registration payment.");
    }
    const result = await confirmPayment(payment.order_id, payment.id);
    if (result.success) {
      const receipt = {
        event: body.event,
        paymentId: payment.id,
        receivedAt: serverTimestamp(),
      };
      // The event ID is unsigned telemetry; payment authority comes from the
      // verified payload and Razorpay fetches, never this optional header.
      if (typeof eventId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(eventId)) {
        receipt.eventId = eventId;
      }
      try {
        await db.collection(environment.ordersCollection).doc(payment.order_id).update({ webhookReceipt: receipt });
      } catch {
        throw new RegistrationError(503, "WEBHOOK_RECEIPT_UNAVAILABLE", "The payment is recorded, but its notification receipt could not be saved. Retry this notification.");
      }
    }
    if (!result.success || (config.TICKET_EMAIL_MODE !== "external" && result.registration.emailStatus !== "Sent")) {
      // Keep the durable ticket and ask Razorpay to retry delivery/confirmation.
      throw new RegistrationError(503, "CONFIRMATION_PENDING", "Payment confirmation or entry pass email is pending. Retry this notification.");
    }
    return result;
  }

  return { configurationStatus, createOrder, verifyCheckout, processWebhook, deliverQueuedEmail: deliverEmail };
}

module.exports = { createRegistrationService, RegistrationError, isConfiguredSecret, REGISTRATION_AMOUNT, REGISTRATION_CURRENCY };
