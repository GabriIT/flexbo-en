// add this prop

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
export interface ProductCardProps {
  id: string;
  title: string;
  category: string;
  src: string;
  mediaType: "image" | "video";
  poster?: string;
  href?: string; // NEW: override link target
}

const PLACEHOLDER = "/media/placeholder.png"; // put a black box here in /public/media

const ProductCard = ({ id, title, category, src, mediaType, poster, href }: ProductCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const to = href ?? `/products/${id}`;

  return (
    <Link to={to} className="block">
      <motion.div /* ...same container... */>
        <div className="image-container aspect-square overflow-hidden bg-black video-card">
          {mediaType === "video" ? (
            <video
              className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={poster ?? PLACEHOLDER}
              onLoadedMetadata={() => setIsLoaded(true)}
              onError={(e) => {
                // if video fails, at least show the poster
                (e.currentTarget as HTMLVideoElement).poster = PLACEHOLDER;
                setIsLoaded(true);
              }}
            >
              <source src={src} type="video/mp4" />
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

        {/* title/category (unchanged) */}
      </motion.div>
    </Link>
  );
};
export default ProductCard;

 
