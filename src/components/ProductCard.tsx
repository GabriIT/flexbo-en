import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/** Allowed media types */
type MediaType = "image" | "video";

export interface ProductCardProps {
  id: string;
  title: string;
  category: string;
  src: string;           // image or video file
  mediaType: MediaType;
  poster?: string;       // optional poster for videos
}

const ProductCard = ({
  id,
  title,
  category,
  src,
  mediaType,
  poster,           // <- new, optional
}: ProductCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Link to={`/products/${id}`} className="block">
      <motion.div
        className="product-card group rounded-lg overflow-hidden bg-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* media wrapper */}
        <div className="image-container aspect-square overflow-hidden bg-black video-card">
          {mediaType === "video" ? (
            <video
              className={`w-full h-full object-cover transition-opacity duration-700 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              autoPlay       // decode first frame immediately
              loop
              muted
              playsInline
              controls
              poster={poster}                     // shows instantly
              onLoadedMetadata={() => setIsLoaded(true)} // fires early
            >
              <source src={src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={src}
              alt={title}
              onLoad={() => setIsLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-700 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
            />
          )}
        </div>

        {/* text */}
        <div className="p-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {category}
          </span>
          <h3 className="mt-1 text-lg font-medium text-gray-900 group-hover:text-black transition-colors">
            {title}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
};

export const ProductCardSkeleton = () => (
  <div className="rounded-lg overflow-hidden bg-gray-100 animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4">
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-5 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export default ProductCard;
