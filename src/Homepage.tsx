// import Landing from "./pages/landingRevamp/LandingRevamp";
import DrawingPreloader from "./pages/components/drawingPreloader/DrawingPreloader";
import useOverlayStore from "./utils/store";
import LandingRevamp from "./pages/landingRevamp/LandingRevamp";
import SEO from "./components/SEO";
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
        item: "https://mm-template.vercel.app/",
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
      <SEO
        title="MohanaMantra 2K26 | MBU National Techno-Cultural Fest"
        description="Official website of MohanaMantra 2K26 at Mohan Babu University (MBU). Join India's premier national level techno-cultural fest celebrating art, music, dance, code, and innovation."
        canonicalUrl="https://mm-template.vercel.app/"
      />
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
