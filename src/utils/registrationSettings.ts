// Test checkout is available only in the local development build. Staff demo
// check-in is a separate authenticated backend operation.
export const allowTestPayments = import.meta.env.DEV;
