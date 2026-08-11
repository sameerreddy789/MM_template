import { useState, useEffect } from "react";
import styles from "./Preloader.module.scss";
import assetList from "../../../../assetList";
import { useLocation } from "react-router-dom";

interface PreloaderProps {
  onEnter: () => void;
  targetLocation: string | null;
}

export default function Preloader({ onEnter, targetLocation }: PreloaderProps) {
  const [progress, setProgress] = useState(0);

  const location = useLocation();
  const page = location.pathname.replace("/", "") as keyof typeof assetList;

  useEffect(() => {
    if (targetLocation) {
      onEnter();
    } else if (!Object.keys(assetList).includes(page)) {
      onEnter();
    }
  }, [targetLocation, page, onEnter]);

  const assets = assetList[page];

  const totalAssets = assets
    ? Object.values(assets).reduce((sum, currentArr) => sum + currentArr.length, 0)
    : 0;

  useEffect(() => {
    if (!assets) return; 

    let loadedAssets = 0;

    const preloadImage = (src: string) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          loadedAssets++;
          setProgress((loadedAssets / totalAssets) * 100);
          resolve(img);
        };
        img.onerror = reject;
      });
    };

    const preloadVideo = (src: string) => {
      return new Promise<HTMLVideoElement>((resolve, reject) => {
        const video = document.createElement("video");
        video.src = src;
        video.onloadeddata = () => {
          loadedAssets++;
          setProgress((loadedAssets / totalAssets) * 100);
          resolve(video);
        };
        video.onerror = reject;
      });
    };

    Promise.allSettled([
      ...(assets.images.map(preloadImage) || []),
      ...(assets.videos.map(preloadVideo) || [])
    ])
      .then(() => {
        onEnter();
      })
      // .catch((err) => {
      //   console.error("Error preloading assets:", err);
      //   onEnter();
      // });

  }, [assets, totalAssets, onEnter]);
  return (
    <div className={styles.preloader}>
      <div className={styles.loadingContainer}>
        <div className={styles.percentage}>{Math.round(progress)}%</div>
      </div>
    </div>
  );
}
