// import Landing from "./pages/landingRevamp/LandingRevamp";
import DrawingPreloader from "./pages/components/drawingPreloader/DrawingPreloader";
import useOverlayStore from "./utils/store";
import LandingRevamp from "./pages/landingRevamp/LandingRevamp";
import { Helmet } from "react-helmet";
import BreadCrumb from "./pages/components/breadCrumb/BreadCrumb";
import bgMusic from "/sounds/bg-music2.mp3";
import { useRef } from "react";
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
        item: "https://www.bits-oasis.org/",
      },
    ],
  };
  const removeGif = useOverlayStore((state) => state.removeGif);
  const audioRef = useRef<HTMLAudioElement>(null);
  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };
  const playMusic = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };
  return (
    <div>
      <Helmet>
        <title>MohanaMantra 2K26 | MBU</title>
        <meta
          name="description"
          content="The official website of MohanaMantra 2K26 | MBU. A grand cultural festival celebrating art, music, and creativity."
        />
        <link rel="canonical" href="https://www.bits-oasis.org/" />
        {/* Open Graph */}
        <meta property="og:title" content="MohanaMantra 2K26 | MBU" />
        <meta
          property="og:description"
          content="The official website of MohanaMantra 2K26 | MBU. A grand cultural festival celebrating art, music, and creativity."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.bits-oasis.org/" />
        <meta
          property="og:image"
          content="https://www.bits-oasis.org/logo2.png"
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
          content="https://www.bits-oasis.org/logo2.png"
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
        src={bgMusic}
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
          audioRef={audioRef}
        />
      </div>
    </div>
  );
}
