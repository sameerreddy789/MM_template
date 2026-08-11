import { useEffect, useRef, useState } from "react";

export const useYouTubePlayer = (
  videos: string[],
  containerRef: React.RefObject<HTMLDivElement | null>
) => {
  const playerRef = useRef<any>(null);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval> | null = null;

    const initPlayer = () => {
      if (playerRef.current || !window.YT?.Player || !containerRef.current) return;

      try {
        const playerDiv = document.createElement("div");
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(playerDiv);

        playerRef.current = new window.YT.Player(playerDiv, {
          height: "100%",
          width: "100%",
          videoId: videos[current] || videos[0],
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (e: any) => {
              const s = window.YT?.PlayerState;
              if (s) {
                if (e.data === s.PLAYING) setIsPlaying(true);
                if (e.data === s.PAUSED) setIsPlaying(false);
                if (e.data === s.ENDED) {
                  setIsPlaying(false);
                  nextVideo();
                }
              }
            },
          },
        });
      } catch (err) {
        console.error("Error creating YouTube player:", err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        initPlayer();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          if (checkInterval) clearInterval(checkInterval);
          initPlayer();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying YT player", e);
        }
        playerRef.current = null;
      }
    };
  }, [containerRef]);

  const nextVideo = () => {
    setCurrent((prev) => {
      const nextIdx = (prev + 1) % videos.length;
      if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById(videos[nextIdx]);
      }
      return nextIdx;
    });
  };

  const prevVideo = () => {
    setCurrent((prev) => {
      const prevIdx = (prev - 1 + videos.length) % videos.length;
      if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById(videos[prevIdx]);
      }
      return prevIdx;
    });
  };

  const togglePlayPause = () => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== "function" || !window.YT?.PlayerState) return;
    const s = playerRef.current.getPlayerState();
    const YTState = window.YT.PlayerState;

    if (s === YTState.PLAYING) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  return { playerRef, current, isPlaying, nextVideo, prevVideo, togglePlayPause };
};
