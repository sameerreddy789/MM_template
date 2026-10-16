// Run with the local frontend and backend already started. HTTP requests are
// read-only. One ignored synthetic probe is created and removed; credential
// contents are never loaded, and no orders, cloud records or emails are created.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { stat, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const origin = new URL(process.env.DEV_TEST_URL || "http://127.0.0.1:5173");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname),
  "Private-file checks may run only against a loopback development server.");
const projectUrl = new URL("../../", import.meta.url);
const projectRoot = fileURLToPath(projectUrl).replace(/\\/g, "/");
const absolutePrivatePath = "/@fs/" + projectRoot + "server/serviceAccountKey.json";
const probeName = "privacy-probe-" + randomUUID() + ".local.txt";
const probeFile = new URL("./" + probeName, import.meta.url);
const protectedPaths = [
  "/rzp.csv", "/rzp.csv?raw", "/server/serviceAccountKey.json",
  "/server/serviceAccountKey.json?raw", "/server/.env.payment-test",
  "/server/paid-test-qr.local.png", "/server/server.js",
  "/testing/payment-gateway/" + probeName,
  absolutePrivatePath, absolutePrivatePath + "?raw",
];

async function run() {
  let checked = 0;
  let skipped = 0;
  await writeFile(probeFile, "Synthetic private-file regression probe", { flag: "wx" });
  try {
    for (const path of protectedPaths) {
      const cleanPath = path.split("?")[0];
      const file = cleanPath.startsWith("/@fs/")
        ? cleanPath.slice("/@fs/".length)
        : fileURLToPath(new URL(cleanPath.slice(1), projectUrl));
      // Missing credentials are skipped rather than manufactured for a test.
      try { await stat(file); } catch (error) {
        if (error.code !== "ENOENT") throw error;
        skipped++;
        continue;
      }
      for (const method of ["HEAD", "GET"]) {
        const response = await fetch(new URL(path, origin), {
          method, redirect: "manual", signal: AbortSignal.timeout(10000),
        });
        await response.body?.cancel();
        assert.equal(response.status, 403, method + " must deny the private path " + path);
        checked++;
      }
    }
    assert.ok(checked >= 4, "Backend source and the synthetic private probe must be denied.");
    for (const path of ["/register", "/gatekeeper"]) {
      const response = await fetch(new URL(path, origin), { method: "HEAD", signal: AbortSignal.timeout(10000) });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /text\/html/);
    }
    const api = await fetch(new URL("/api/registration-status", origin), { signal: AbortSignal.timeout(10000) });
    assert.equal(api.status, 200);
    const status = await api.json();
    assert.equal(typeof status.ready, "boolean");
    assert.ok(["test", "live"].includes(status.paymentMode));
    console.log(JSON.stringify({ privateRequestsDenied: checked, missingPrivatePathsSkipped: skipped,
      publicPagesReachable: true, apiProxyReachable: true, paymentMode: status.paymentMode }));
  } finally { await unlink(probeFile); }
}
run().catch(error => { console.error("Development privacy check failed:", error.message); process.exitCode = 1; });
