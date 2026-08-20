import { create } from "zustand";

type overlayActive ={
    isActive: boolean;
    removeGif: boolean;
    setActive: () => void;
    setRemoveGif: () => void;
}

const hasEnteredSession =
    typeof window !== "undefined" &&
    sessionStorage.getItem("mm_has_entered") === "true";

const useOverlayStore = create<overlayActive>((set) => ({
    isActive: hasEnteredSession,
    removeGif: hasEnteredSession,
    setActive: () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("mm_has_entered", "true");
        }
        set({ isActive: true });
    },
    setRemoveGif: () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("mm_has_entered", "true");
        }
        set({ removeGif: true });
    }
}));

export default useOverlayStore;

type ham = {
    isHamOpen: boolean;
    setHamOpen: (isOpen: boolean) => void;
}
export const useHamStore = create<ham>((set) => ({
    isHamOpen: false,
    setHamOpen: (isOpen) => set({ isHamOpen: isOpen })
}));

type mainHam = {
    isMainHamOpen: boolean;
    setMainHamOpen: (isOpen: boolean) => void;
}
export const useMainHamStore = create<mainHam>((set) => ({
    isMainHamOpen: false,
    setMainHamOpen: (isOpen) => set({ isMainHamOpen: isOpen })
}));

export const PLAYLIST = [
    "/sounds/Shape of U x Carnatic.mp3",
    "/sounds/FUNK DESTRAVADO slowed.mp3",
    "/sounds/bg-music.mp3",
    "/sounds/bg-music2.mp3"
];

// The whole music system lives here so it can outlive any page. App has no
// <Routes>; it conditionally renders each page as a sibling, so every component
// below it is destroyed on navigation. The <audio> element therefore belongs to
// BackgroundMusic, which App mounts once outside that conditional block, and the
// element is parked in this store so the player controls on the landing page can
// still reach it from a different part of the tree.
//
// audioEl is deliberately state rather than a ref: consumers need to re-render
// when the element arrives, otherwise an effect that subscribes to its play and
// pause events would run once against null and never attach.
type music = {
    isMusicOn: boolean;
    trackIndex: number;
    audioEl: HTMLAudioElement | null;
    setMusicOn: (isOn: boolean) => void;
    setTrackIndex: (index: number) => void;
    setAudioEl: (el: HTMLAudioElement | null) => void;
    play: () => void;
    pause: () => void;
    toggle: () => void;
    next: () => void;
    prev: () => void;
}
export const useMusicStore = create<music>((set, get) => ({
    isMusicOn: false,
    trackIndex: 0,
    audioEl: null,
    setMusicOn: (isOn) => set({ isMusicOn: isOn }),
    setTrackIndex: (index) => set({ trackIndex: index }),
    setAudioEl: (el) => set({ audioEl: el }),

    // play() rejects when the browser refuses autoplay. Swallow it: the player
    // icon is derived from the element's own events, so it stays truthful either
    // way, and an uncaught rejection would just noise up the console.
    play: () => {
        set({ isMusicOn: true });
        get().audioEl?.play().catch(() => {});
    },
    pause: () => {
        set({ isMusicOn: false });
        get().audioEl?.pause();
    },
    // The element's own paused flag is the source of truth, not isMusicOn, so a
    // toggle still does the expected thing if the two ever drift (a rejected
    // autoplay, say).
    toggle: () => {
        const audio = get().audioEl;
        if (!audio) return;
        if (audio.paused) {
            set({ isMusicOn: true });
            audio.play().catch(() => {});
        } else {
            set({ isMusicOn: false });
            audio.pause();
        }
    },
    // Track changes only move the index. Swapping the src resets the element to
    // paused, and BackgroundMusic's reconciling effect picks it back up once the
    // new src has actually been committed - which is why there is no longer a
    // setTimeout here guessing at how long that takes.
    next: () => set((s) => ({ trackIndex: (s.trackIndex + 1) % PLAYLIST.length })),
    prev: () => set((s) => ({
        trackIndex: (s.trackIndex - 1 + PLAYLIST.length) % PLAYLIST.length
    }))
}));

// The navbar owns the scroll listener that decides whether the header is showing.
// Anything else pinned to the top of the viewport (currently the music player)
// reads this so it slides away in lockstep instead of running a second scroll
// listener that would drift out of sync.
type navVisibility = {
    isNavVisible: boolean;
    setNavVisible: (isVisible: boolean) => void;
}
export const useNavVisibilityStore = create<navVisibility>((set) => ({
    isNavVisible: true,
    setNavVisible: (isVisible) => set({ isNavVisible: isVisible })
}));
