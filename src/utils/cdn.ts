/**
 * Single source of truth for where the site's binary assets live.
 *
 * Every image, sound and video used by the site is stored in S3
 * (bucket `mohanamantra-2026-assets`, region ap-south-1) and served through
 * CloudFront. Nothing image-shaped ships in the git repo or the deploy bundle
 * any more, so `dist/` is now essentially just HTML, CSS and JS.
 *
 * Why CloudFront in front of S3 rather than raw S3 URLs:
 *   - edge caching in-region (PriceClass_200 includes India, where the audience is)
 *   - automatic Brotli/gzip on text assets. S3 alone never compresses, and the
 *     preloader sketch `svgs/landing/LatestProcessed.svg` is 548 KB raw
 *   - HTTP/2 and HTTP/3, so the ~190 assets multiplex over one connection
 * The bucket is still the origin, so the raw S3 URL for any key also works:
 *   https://mohanamantra-2026-assets.s3.ap-south-1.amazonaws.com/<key>
 *
 * Objects are uploaded with `Cache-Control: public, max-age=31536000, immutable`.
 * That is what makes repeat visits instant, but it also means a *replaced* file
 * under an existing name will not be picked up by browsers that already have it.
 * To publish a change to an existing asset, either upload it under a new name or
 * issue a CloudFront invalidation:
 *   aws cloudfront create-invalidation --distribution-id EC5G9UD80YI73 --paths "/images/foo.webp"
 *
 * To move to a custom domain (e.g. cdn.mohanamantra.com), point a CNAME at the
 * distribution, attach an ACM certificate, and change CDN_BASE below. SCSS and
 * index.html carry the literal origin because neither can call a TS function, so
 * grep for the hostname there too.
 */

/** CloudFront distribution EC5G9UD80YI73, origin = the S3 asset bucket. */
export const CDN_BASE = "https://d3hw0wgw9j5gvz.cloudfront.net";

/**
 * Resolves a root-absolute asset key to its full CDN URL.
 *
 * Keys keep the same directory layout the files had under `public/`, so
 * `/images/events/Eventpics/Jenga.webp` is exactly where it always was --
 * only the origin and, for former PNG/JPEG files, the extension changed.
 *
 * Already-absolute URLs pass through untouched so callers can mix in
 * third-party images (YouTube thumbnails, sponsor logos) without special-casing.
 */
export function cdn(key: string): string {
  if (/^(https?:)?\/\//.test(key) || key.startsWith("data:")) return key;
  return CDN_BASE + (key.startsWith("/") ? key : `/${key}`);
}

export default cdn;
