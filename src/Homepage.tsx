// import Landing from "./pages/landingRevamp/LandingRevamp";
import DrawingPreloader from "./pages/components/drawingPreloader/DrawingPreloader";
import useOverlayStore from "./utils/store";
import LandingRevamp from "./pages/landingRevamp/LandingRevamp";
import { Helmet } from "react-helmet-async";
import BreadCrumb from "./pages/components/breadCrumb/BreadCrumb";
import { useMusicStore } from "./utils/store";
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

  // The audio element, the transport controls and the spacebar shortcut all moved
  // to BackgroundMusic, which App mounts once so playback survives navigation.
  // The only piece still needed here is the initial start: the preloader's Enter
  // click is the user gesture that unlocks autoplay, and nothing later in the
  // session gets a better one.
  const playMusic = useMusicStore((state) => state.play);

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
      {!removeGif && (
        <div style={{ zIndex: 50, position: "relative" }}>
          <DrawingPreloader onEnter={playMusic} />
        </div>
      )}
      <div style={{ zIndex: 100, position: "relative" }}>
        <LandingRevamp goToPage={goToPage} />
      </div>
    </div>
  );
}
