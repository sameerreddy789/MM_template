import { useEffect, useState } from "react";
import Logo from "/images/logo.webp";
interface EventImageProps {
  imageUrl?: string | string[];
  alt?: string;
  className?: string;
  previewClass?: string;
}

const EventImage: React.FC<EventImageProps> = ({
  imageUrl,
  alt = "Event image",
  className,
  previewClass,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = Array.isArray(imageUrl) ? imageUrl : (imageUrl ? [imageUrl] : []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [imageUrl]);

  useEffect(() => {
    if (images.length === 0) {
      setImageLoaded(false);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.src = images[currentIndex];
    img.onload = () => {
      if (isMounted) setImageLoaded(true);
    };
    img.onerror = () => {
      if (isMounted) setImageLoaded(false);
    };

    return () => {
      isMounted = false;
    };
  }, [currentIndex, images]);

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 3000); // Slideshow changes every 3 seconds
      return () => clearInterval(interval);
    }
  }, [images.length]);

  if (images.length === 0 || !imageLoaded) {
    return (
      <img src={Logo} alt="Loading placeholder" className={previewClass} />
    );
  }
  return (
    <img 
      src={images[currentIndex]} 
      alt={alt} 
      className={className} 
      style={{ transition: 'opacity 0.5s ease-in-out' }} 
    />
  );
};
export default EventImage;
