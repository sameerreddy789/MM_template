const { paymentEnvironment } = require("./paymentEnvironment");
const { isConfiguredSecret, RegistrationError } = require("./registration");

function availableGatekeeperModes(config) {
  const currentMode = paymentEnvironment(config).mode;
  const modes = [currentMode];
  if (currentMode === "live" && config.GATEKEEPER_TEST_ENABLED === "true" &&
    isConfiguredSecret(config.TEST_JWT_SECRET, 32)) modes.push("test");
  return modes;
}

// This scope is selected only after staff authentication. It never changes
// the Razorpay client, public checkout, or the live registration collection.
function gatekeeperEnvironment(config, requestedMode) {
  const currentMode = paymentEnvironment(config).mode;
  const mode = requestedMode === undefined ? currentMode : requestedMode;
  if (!availableGatekeeperModes(config).includes(mode)) {
    throw new RegistrationError(400, "GATEKEEPER_MODE_UNAVAILABLE", "Select an available pass environment. Test passes require staff demo mode.");
  }
  return {
    ...paymentEnvironment({ PAYMENT_MODE: mode }),
    jwtSecret: mode === "test" && currentMode === "live" ? config.TEST_JWT_SECRET : config.JWT_SECRET,
  };
}

module.exports = { availableGatekeeperModes, gatekeeperEnvironment };
