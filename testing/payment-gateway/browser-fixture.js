// Inject only into an isolated localhost QA browser. Never import into the website.
// All payment APIs and checkout below are substitutes: no charges or emails.
(() => {
  if (window.location.origin !== 'http://localhost:5173') return;
  const scenario = sessionStorage.getItem('mm26:qa-scenario') || 'success';
  const originalFetch = window.fetch.bind(window);
  const state = window.__mmRegistrationQA = {
    scenario, orders: 0, opened: 0, verified: 0, closed: 0,
    orderId: '', checkoutOrderId: '', student: null, confirmNow: false, emailSent: false,
  };
  const response = (body, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
  window.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.origin !== location.origin) return originalFetch(input, options);
    if (url.pathname === '/api/registration-status') return response({ ready: true, amount: 100000, currency: 'INR', paymentMode: 'test' });
    if (url.pathname === '/api/register') {
      state.orders++;
      state.student = JSON.parse(options.body);
      if (scenario === 'order-fails') return response({ success: false, code: 'REGISTRATION_UNAVAILABLE',
        error: "We couldn't save your registration details. Please try again before paying." }, 503);
      state.orderId = `order_BrowserQA${state.orders}`;
      return response({ success: true, order_id: state.orderId, key_id: 'rzp_test_BrowserQA', amount: 100000, currency: 'INR', paymentMode: 'test' });
    }
    if (url.pathname === '/api/payment-verify') {
      state.verified++;
      if (scenario === 'verification-fails' && !state.confirmNow) return response({ success: false,
        code: 'VERIFICATION_UNAVAILABLE', error: 'Payment confirmation is temporarily unavailable. Keep your receipt and try again.' }, 503);
      if (scenario === 'pending' && !state.confirmNow) return response({ success: false, paymentStatus: 'Pending' }, 202);
      const proof = JSON.parse(options.body);
      return response({ success: true, registration: {
        ticketId: 'MM26-TEST-A1B2C3', name: state.student?.name || 'Browser Test', paymentMode: 'test',
        email: state.student?.email || 'browser.test@example.invalid',
        paymentId: proof.razorpay_payment_id, amount: 1000, paymentStatus: 'Paid',
        emailStatus: scenario === 'email-pending' && !state.emailSent ? 'Failed' : 'Sent',
      } });
    }
    return originalFetch(input, options);
  };
  window.Razorpay = class {
    constructor(options) { this.options = options; state.checkoutOrderId = options.order_id; }
    open() {
      state.opened++;
      setTimeout(() => {
        if (scenario === 'checkout-cancel') return this.options.modal.ondismiss();
        this.options.handler({ razorpay_order_id: this.options.order_id,
          razorpay_payment_id: 'pay_BrowserQA',
          ...(scenario === 'checkout-incomplete' ? {} : { razorpay_signature: 'a'.repeat(64) }),
        });
      }, 40);
    }
    close() { state.closed++; }
  };
})();
