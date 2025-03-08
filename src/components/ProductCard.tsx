
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProductCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
}

const ProductCard = ({ id, title, category, image }: ProductCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Link to={`/products/${id}`} className="block">
      <div className="product-card group rounded-lg overflow-hidden bg-white">
        <div className="image-container aspect-square overflow-hidden">
          <img
            src={image}
            alt={title}
            onLoad={() => setIsLoaded(true)}
            className={`product-image w-full h-full object-cover transition-opacity duration-700 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className="image-overlay" />
        </div>
        
        <div className="p-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {category}
          </span>
          <h3 className="mt-1 text-lg font-medium text-gray-900 group-hover:text-black transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
};

// Load error placeholder function
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
