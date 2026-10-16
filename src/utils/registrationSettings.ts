// Public registration stays closed until the live setup is confirmed and both
// the frontend and backend are explicitly opened. Local development keeps the
// existing form available for the separate payment-test environment.
export const registrationFormEnabled = import.meta.env.DEV ||
  import.meta.env.VITE_REGISTRATIONS_OPEN === "true";
