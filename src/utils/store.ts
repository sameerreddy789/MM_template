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
