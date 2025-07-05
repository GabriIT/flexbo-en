import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

// ─── Featured products data ─────────────────────────────────────────────
const featuredProducts = [
  {
    id: 'aseptic-bags',
    title: 'Premium Aseptic Bags',
    category: 'Bags',
    src: '/media/aseptic_bag14.jpg',   // ① rename image → src
    mediaType: 'image',               // ② tell the card it’s an image
  },
  {
    id: 'Carton or IBC Containers',
    title: 'Logistics IBC Containers',
    category: 'IBC',
    src: '/media/IBC_Valves.jpg',
    mediaType: 'image',
  },
  {
    id: 'BIB',
    title: 'BIB',
    category: 'Specialty',
    src: '/media/HB_bags24.jpg',
    mediaType: 'image',
  },

  {
    id: 'BIB',
    title: 'More than 40 valves types',
    category: 'Specialty',
    src: '/media/most_common_valves.jpg',
    mediaType: 'image',
  },

  
  {
    id: 'Solvent-Free Laminated Film',
    title: 'Environment-friendly solutions',
    category: 'Film',
    src: '/media/mPet_TL.jpg',
    mediaType: 'image',
  },

  {
    id: 'Flexbo Intro Video',
    title: 'Flexbo Presentation',
    category: 'Presentation',
    src: '/media/Flexbo_Introduction_EN.mp4',
    mediaType: 'video', // ③ tell the card it’s a video
  },


];

const FeaturedProducts = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Our Collection
        </span>
        <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
          Featured Products
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Discover our most popular packaging solutions designed to elevate your brand experience.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {featuredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            {/* just spread – the object already has src + mediaType */}
            <ProductCard {...product} />
          </motion.div>
        ))}
      </div>

      {/* Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <Link
          to="/products"
          className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-primary transition-colors"
        >
          View All Products
          <ArrowRight size={16} className="ml-1" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default FeaturedProducts;
