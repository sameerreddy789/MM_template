import { useEffect } from 'react';
import type { RefObject } from 'react';

/** The gallery showreel only ever plays its first 13 seconds, then jumps back to 0:00. */
export const GALLERY_VIDEO_LOOP_SECONDS = 13;

/**
 * Wrap this many seconds early. A frame callback runs after its frame has already
 * been shown, so wrapping a hair before 0:13.00 keeps the 0:13.00 frame from ever
 * appearing (one frame is about 42 ms at 24 fps, 33 ms at 30 fps).
 */
const WRAP_EARLY_SECONDS = 0.05;

/**
 * Loops a <video> over its first `segmentSeconds` seconds instead of the whole file.
 *
 * The native `loop` attribute only wraps at the end of the file, so the wrap is
 * done by hand:
 *  - a per-frame check (requestVideoFrameCallback, else requestAnimationFrame) lands
 *    the wrap within a frame of the boundary;
 *  - `timeupdate` is a backstop, and is all that still fires in a background tab;
 *  - `seeking` / `seeked` snap a scrub past the boundary back to 0:00;
 *  - `ended` restarts a clip that is shorter than the segment.
 *
 * Everything lives in the effect's closure (no state), so nothing re-renders per
 * frame, and cleanup removes every listener and pending callback, which keeps the
 * hook safe under StrictMode's mount, unmount, mount. It never sets `loop`, `muted`
 * or `autoplay`; those stay on the element.
 */
export function useVideoSegmentLoop(
    videoRef: RefObject<HTMLVideoElement | null>,
    enabled = true,
    segmentSeconds = GALLERY_VIDEO_LOOP_SECONDS,
): void {
    useEffect(() => {
        const video = videoRef.current;
        if (!enabled || !video) return;

        const wrapAt = segmentSeconds - WRAP_EARLY_SECONDS;
        const hasFrameCallback = typeof video.requestVideoFrameCallback === 'function';
        let handle: number | null = null;

        const wrap = () => {
            // Read these before seeking: seeking to 0 clears `ended`. A paused video that
            // has not ended stays paused, so a user pause is never overridden.
            const keepPlaying = video.ended || !video.paused;
            video.currentTime = 0;
            if (keepPlaying && video.paused) void video.play().catch(() => {});
        };

        const check = () => {
            if (video.currentTime >= wrapAt) wrap();
        };

        const cancel = () => {
            if (handle === null) return;
            if (hasFrameCallback) video.cancelVideoFrameCallback(handle);
            else cancelAnimationFrame(handle);
            handle = null;
        };

        const schedule = () => {
            cancel(); // never hold two pending callbacks
            handle = hasFrameCallback
                ? video.requestVideoFrameCallback(onFrame)
                : requestAnimationFrame(onFrame);
        };

        const onFrame = () => {
            handle = null;
            check();
            schedule();
        };

        const onSeek = () => {
            // Seeks past the boundary (scrubbing the popup's controls) snap to the start.
            // No play() here, so a paused video stays paused.
            if (video.currentTime >= wrapAt) video.currentTime = 0;
        };

        const onEnded = () => {
            // Only reached when the clip is shorter than the segment.
            cancel();
            wrap();
        };

        const onLoadedMetadata = () => {
            if (video.currentTime !== 0) video.currentTime = 0;
        };

        // The frame driver only runs while playing, so a paused video costs nothing.
        video.addEventListener('play', schedule);
        video.addEventListener('playing', schedule);
        video.addEventListener('pause', cancel);
        video.addEventListener('timeupdate', check);
        video.addEventListener('seeking', onSeek);
        video.addEventListener('seeked', onSeek);
        video.addEventListener('ended', onEnded);
        video.addEventListener('loadedmetadata', onLoadedMetadata);

        // Metadata or playback may have started before this effect attached.
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onLoadedMetadata();
        if (!video.paused) schedule();

        return () => {
            cancel();
            video.removeEventListener('play', schedule);
            video.removeEventListener('playing', schedule);
            video.removeEventListener('pause', cancel);
            video.removeEventListener('timeupdate', check);
            video.removeEventListener('seeking', onSeek);
            video.removeEventListener('seeked', onSeek);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [videoRef, enabled, segmentSeconds]);
}
