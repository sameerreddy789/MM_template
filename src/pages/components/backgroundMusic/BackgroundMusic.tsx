import { useCallback, useEffect } from "react";
import { PLAYLIST, useMusicStore } from "../../../utils/store";

/**
 * The site's background music, mounted once by App outside the conditional page
 * block so it survives navigation.
 *
 * This element used to live in Homepage, which App unmounts whenever the route
 * changes or the preloader takes over. React removed the <audio> node with it, so
 * playback died on every navigation and could only restart from zero on return.
 * Mounting it here means one element for the whole session.
 *
 * `suppressed` silences playback without touching the user's preference, so the
 * music resumes on its own once the page that asked for quiet is left behind.
 */
export default function BackgroundMusic({
  suppressed,
}: {
  /** Pause while true - the gallery autoplays an unmuted video of its own. */
  suppressed: boolean;
}) {
  const trackIndex = useMusicStore((state) => state.trackIndex);
  const isMusicOn = useMusicStore((state) => state.isMusicOn);
  const audioEl = useMusicStore((state) => state.audioEl);
  const setAudioEl = useMusicStore((state) => state.setAudioEl);
  const toggle = useMusicStore((state) => state.toggle);

  // Stable identity matters here. An inline arrow would be a new function every
  // render, so React would detach and reattach the ref each time, and because
  // setAudioEl writes to a store this component reads from, that would re-render
  // and reattach forever. Zustand actions are stable, so this closes over one.
  const attachAudio = useCallback(
    (el: HTMLAudioElement | null) => {
      if (el) el.volume = 0.2; // 0.0 - 1.0
      setAudioEl(el);
    },
    [setAudioEl]
  );

  // One place reconciles the element with the intended state, covering all four
  // ways it can drift: the element first appearing, the user toggling playback,
  // moving on or off a suppressed page, and changing track (swapping src leaves
  // the element paused, and this runs after the new src is committed).
  useEffect(() => {
    if (!audioEl) return;

    if (suppressed || !isMusicOn) {
      audioEl.pause();
      return;
    }

    audioEl.play().catch(() => {});
  }, [audioEl, isMusicOn, suppressed, trackIndex]);

  // Spacebar toggles music globally, but not on a suppressed page: there are no
  // player controls there to reflect the change, and the reconciling effect would
  // immediately pause it again, so the keypress would look broken.
  useEffect(() => {
    if (suppressed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;

      e.preventDefault();
      toggle();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suppressed, toggle]);

  return <audio src={PLAYLIST[trackIndex]} loop ref={attachAudio} />;
}
