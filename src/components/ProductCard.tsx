import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type MediaType = "image" | "video";

export interface ProductCardProps {
  id: string;
  title: string;
  category: string;
  src: string;       // image or video file
  mediaType: MediaType;
  poster?: string;   // optional poster for videos
  href?: string;     // optional custom link (keep if you added earlier)
}

const PLACEHOLDER = "/media/placeholder.png";

export default function ProductCard({
  id,
  title,
  category,
  src,
  mediaType,
  poster,
  href,
}: ProductCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const to = href ?? `/products/${id}`;

  const CardBody = (
    <motion.div
      className="product-card group rounded-lg overflow-hidden bg-white"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* media */}
      <div className="image-container aspect-square overflow-hidden bg-black video-card relative">
        {mediaType === "video" ? (
          <video
            className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            controls        // ← native controls include fullscreen
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={poster ?? PLACEHOLDER}
            onLoadedMetadata={() => setIsLoaded(true)}
            onError={(e) => {
              (e.currentTarget as HTMLVideoElement).poster = PLACEHOLDER;
              setIsLoaded(true);
            }}
          >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={src}
            alt={title}
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
              setIsLoaded(true);
            }}
            className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
          />
        )}
      </div>

      {/* text */}
      <div className="p-4">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {category}
        </span>

        {mediaType === "video" ? (
          // For videos, only the title is a link so native controls remain usable
          <h3 className="mt-1 text-lg font-medium text-gray-900 group-hover:text-black transition-colors">
            <Link to={to} className="hover:underline">
              {title}
            </Link>
          </h3>
        ) : (
          // For images, keep plain title; the whole card is clickable anyway
          <h3 className="mt-1 text-lg font-medium text-gray-900 group-hover:text-black transition-colors">
            {title}
          </h3>
        )}
      </div>
    </motion.div>
  );

  // Wrap the whole card in a link for IMAGES only.
  if (mediaType === "image") {
    return (
      <Link to={to} className="block">
        {CardBody}
      </Link>
    );
  }

  // For VIDEOS, return the card without a wrapping link (title is clickable).
  return <div className="block">{CardBody}</div>;
}
