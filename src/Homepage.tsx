// import Landing from "./pages/landingRevamp/LandingRevamp";
import DrawingPreloader from "./pages/components/drawingPreloader/DrawingPreloader";
import useOverlayStore from "./utils/store";
import LandingRevamp from "./pages/landingRevamp/LandingRevamp";
import { Helmet } from "react-helmet";
import BreadCrumb from "./pages/components/breadCrumb/BreadCrumb";
import { useEffect, useRef } from "react";
import { useMusicStore } from "./utils/store";
const PLAYLIST = [
  "/sounds/Shape of U x Carnatic.mp3",
  "/sounds/FUNK DESTRAVADO slowed.mp3",
  "/sounds/bg-music.mp3",
  "/sounds/bg-music2.mp3"
];
export default function Homepage({
  goToPage,
}: {
  goToPage: (path: string) => void;
}) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.mohanamantra.com/",
      },
    ],
  };
  const removeGif = useOverlayStore((state) => state.removeGif);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Held in the store rather than component state: App unmounts Homepage on
  // every navigation, so local state here would reset each time the user came
  // back and the music would restart from silence on track one.
  const isMusicOn = useMusicStore((state) => state.isMusicOn);
  const setMusicOn = useMusicStore((state) => state.setMusicOn);
  const currentTrackIndex = useMusicStore((state) => state.trackIndex);
  const setCurrentTrackIndex = useMusicStore((state) => state.setTrackIndex);

  // play() rejects when the browser refuses autoplay. Swallow it: the player UI
  // derives its icon from the audio element's own play/pause events, so it stays
  // truthful either way, and an uncaught rejection would just noise up the console.
  const startPlayback = () => audioRef.current?.play().catch(() => {});

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      setMusicOn(true);
      startPlayback();
    } else {
      setMusicOn(false);
      audioRef.current.pause();
    }
  };

  const playMusic = () => {
    setMusicOn(true);
    startPlayback();
  };

  const nextMusic = () => {
    const wasPlaying = audioRef.current && !audioRef.current.paused;
    setCurrentTrackIndex((currentTrackIndex + 1) % PLAYLIST.length);
    if (wasPlaying) {
      setTimeout(startPlayback, 50);
    }
  };

  const prevMusic = () => {
    const wasPlaying = audioRef.current && !audioRef.current.paused;
    setCurrentTrackIndex(
      (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length
    );
    if (wasPlaying) {
      setTimeout(startPlayback, 50);
    }
  };

  // Resume when returning to the landing page. The <audio> element is rebuilt on
  // every mount and the browser hands it back paused, so without this the music
  // stays silent after navigating away and back even though the user had it on.
  // Gated on the stored preference so a deliberate pause is still respected.
  useEffect(() => {
    if (!isMusicOn) return;
    startPlayback();
  }, [isMusicOn]);

  return (
    <div>
      <Helmet>
        <title>MohanaMantra 2K26 | MBU</title>
        <meta
          name="description"
          content="The official website of MohanaMantra 2K26 | MBU. A grand cultural festival celebrating art, music, and creativity."
        />
        <link rel="canonical" href="https://www.mohanamantra.com/" />
        {/* Open Graph */}
        <meta property="og:title" content="MohanaMantra 2K26 | MBU" />
        <meta
          property="og:description"
          content="The official website of MohanaMantra 2K26 | MBU. A grand cultural festival celebrating art, music, and creativity."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mohanamantra.com/" />
        <meta
          property="og:image"
          content="https://www.mohanamantra.com/logo2.png"
        />
        <meta property="og:site_name" content="MohanaMantra 2K26 | MBU" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MohanaMantra 2K26 | MBU" />
        <meta
          name="twitter:description"
          content="A grand cultural festival celebrating art, music, and creativity at MBU."
        />
        <meta
          name="twitter:image"
          content="https://www.mohanamantra.com/logo2.png"
        />
      </Helmet>
      <BreadCrumb data={breadcrumbJsonLd} />
      <div
        style={
          removeGif ? { display: "none" } : { zIndex: 50, position: "relative" }
        }
      >
        <DrawingPreloader onEnter={playMusic} />
      </div>
      <audio
        src={PLAYLIST[currentTrackIndex]}
        loop
        ref={(el) => {
          audioRef.current = el;
          if (el) el.volume = 0.2; // set volume between 0.0 and 1.0
        }}
      />
      <div style={{ zIndex: 100, position: "relative" }}>
        <LandingRevamp
          goToPage={goToPage}
          onToggle={toggleMusic}
          onNext={nextMusic}
          onPrev={prevMusic}
          audioRef={audioRef}
        />
      </div>
    </div>
  );
}
