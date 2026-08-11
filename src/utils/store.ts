import { create } from "zustand";

type overlayActive ={
    isActive: boolean;
    removeGif: boolean;
    setActive: () => void;
    setRemoveGif: () => void;
}

const useOverlayStore = create<overlayActive>((set) => ({
    isActive: false,
    removeGif: false,
    setActive: () => set({ isActive: true }),
    setRemoveGif: () => set({ removeGif: true })
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

// Music preference has to outlive the homepage mount. The <audio> element lives
// inside Homepage, and App unmounts Homepage on every navigation, so the element
// is destroyed and recreated paused each time. Keeping the user's choice and the
// selected track here means returning to the landing page resumes what was
// playing instead of falling silent and resetting to the first track.
type music = {
    isMusicOn: boolean;
    trackIndex: number;
    setMusicOn: (isOn: boolean) => void;
    setTrackIndex: (index: number) => void;
}
export const useMusicStore = create<music>((set) => ({
    isMusicOn: false,
    trackIndex: 0,
    setMusicOn: (isOn) => set({ isMusicOn: isOn }),
    setTrackIndex: (index) => set({ trackIndex: index })
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
