/**
 * Pulls the whole image catalogue into the browser cache while the visitor is
 * still on the landing page.
 *
 * Why this exists: every page except the landing one is hard-gated behind a
 * preloader that blocks rendering until its images arrive (App.tsx only mounts a
 * page when `!isPreloading`, and DoorTransition holds the doors shut while
 * loadAssets runs). Those gates are what produce the visible "0% ... 100%" wait
 * on navigation. A visitor reading the landing page has idle bandwidth, so if the
 * catalogue is already cached by the time they click through, every one of those
 * gates resolves on the first frame and the pages paint immediately.
 *
 * Two things make the cache actually hit:
 *   1. Every reference in the app now resolves through `cdn()`, so the URL warmed
 *      here is byte-identical to the URL the <img> later requests. That was not
 *      true before: assetList.ts asked for "./images/x.webp" while components
 *      imported "/images/x.webp", which are two separate cache entries, so the
 *      old preloading was partly wasted.
 *   2. Objects are served with `max-age=31536000, immutable`, so the browser
 *      reuses them without even a revalidation request.
 *
 * `decode()` is the part that removes the last of the delay. A cached image still
 * has to be decoded to a bitmap before it can paint, and doing that on demand is
 * what causes an image to "pop in" a frame late. Decoding here, off the critical
 * path, means the later paint is immediate.
 */

import {
  CRITICAL_LANDING_ASSETS,
  DEFERRED_IMAGE_ASSETS,
} from "../assetManifest.generated";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
};

interface WarmupOptions {
  /**
   * Parallel requests. HTTP/2 multiplexes over one connection so this is not
   * about connection limits -- it caps how much decode work is queued at once.
   */
  concurrency?: number;
  /** Ignore the Save-Data / slow-connection opt-out. */
  force?: boolean;
}

const warmed = new Set<string>();
let started = false;

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

/**
 * Honours the visitor's own bandwidth preferences. Warming ~14 MB is the right
 * trade on wifi and a hostile one on a metered 2G connection, and Save-Data is an
 * explicit request not to do this. Pages still work either way -- they just fall
 * back to loading images when navigated to, exactly as before.
 */
function shouldSkipWarmup(): boolean {
  const c = connection();
  if (!c) return false;
  if (c.saveData) return true;
  return c.effectiveType === "slow-2g" || c.effectiveType === "2g";
}

/** Fetches and decodes one URL. Never rejects: a warm-up failure is not an error. */
export function warmImage(url: string, priority: "high" | "low" = "low"): Promise<void> {
  if (warmed.has(url)) return Promise.resolve();
  warmed.add(url);

  return new Promise<void>((resolve) => {
    const img = new Image();
    // `fetchPriority` keeps the deferred bulk behind anything the visible page
    // wants. Not in every browser's lib.dom yet, hence the cast.
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
    img.decoding = "async";

    const done = () => resolve();
    img.onload = () => {
      // Decode to a bitmap now so the eventual paint costs nothing. Chrome and
      // Safari implement this; elsewhere the onload cache entry is still the win.
      if (typeof img.decode === "function") img.decode().then(done, done);
      else done();
    };
    img.onerror = done;
    img.src = url;
  });
}

/** Warms a list with a bounded number of requests in flight. */
export async function warmAssets(
  urls: readonly string[],
  { concurrency = 6 }: WarmupOptions = {}
): Promise<void> {
  const queue = urls.filter((u) => !warmed.has(u));
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (cursor < queue.length) {
      const url = queue[cursor++];
      await warmImage(url);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, worker)
  );
}

function onIdle(fn: () => void): void {
  const ric = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (ric) ric(fn, { timeout: 2000 });
  else window.setTimeout(fn, 200);
}

/**
 * Kicks off the warm-up. Safe to call more than once; only the first call runs.
 *
 * Critical assets go first and at high priority, though index.html already
 * preloads them, so in practice this just adds the decode. The bulk then follows
 * once the browser reports itself idle, so it never delays first paint.
 */
export function startAssetWarmup(options: WarmupOptions = {}): void {
  if (started) return;
  started = true;

  if (!options.force && shouldSkipWarmup()) return;

  void (async () => {
    await warmAssets(CRITICAL_LANDING_ASSETS, { concurrency: 4, ...options });
    onIdle(() => {
      void warmAssets(DEFERRED_IMAGE_ASSETS, { concurrency: 6, ...options });
    });
  })();
}

/** Test/debug helper: how much of the catalogue has been touched so far. */
export function warmupProgress(): { warmed: number; total: number } {
  return {
    warmed: warmed.size,
    total: CRITICAL_LANDING_ASSETS.length + DEFERRED_IMAGE_ASSETS.length,
  };
}
