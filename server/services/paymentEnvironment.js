// Test payments have separate records and visibly distinct, non-production passes.
function paymentEnvironment(config = process.env) {
  const keyMode = /^rzp_(test|live)_[A-Za-z0-9]+$/.exec(config.RAZORPAY_KEY_ID || "")?.[1];
  const mode = config.PAYMENT_MODE || keyMode || "live";
  const test = mode === "test";
  return {
    mode,
    keyMatchesMode: ["test", "live"].includes(mode) && keyMode === mode,
    ordersCollection: test ? "testRegistrationOrders" : "registrationOrders",
    registrationsCollection: test ? "testRegistrations" : "registrations",
    ticketPrefix: test ? "MM26-TEST-" : "MM26-",
  };
}

function recordMatchesMode(record, mode) {
  // Existing live registrations predate the explicit mode field.
  return record && (record.paymentMode === mode || (mode === "live" && record.paymentMode === undefined));
}

module.exports = { paymentEnvironment, recordMatchesMode };
