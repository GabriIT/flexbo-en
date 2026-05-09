import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const featuredProducts = [
  {
    id: 'flexbo-video',
    title: 'Flexbo Introduction',
    category: 'Video',
    src: `${import.meta.env.BASE_URL}media/Flexbo_Introduction_EN.mp4`,
    mediaType: 'video',
  },
  {
    id: 'aseptic-bags',
    title: 'Premium Aseptic Bags',
    category: 'Bags',
    src: `${import.meta.env.BASE_URL}media/aseptic_bag14.jpg`,
    mediaType: 'image',
    href: '/aseptic-bags',
  },
  {
    id: 'ibc-packaging',
    title: 'IBC Packaging',
    category: 'IBC Containers',
    src: `${import.meta.env.BASE_URL}media/IBC_Valves.jpg`,
    mediaType: 'image',
    href: '/liquid-bags',
  },
  {
    id: 'bib',
    title: 'BIB',
    category: 'Bag-in-Box',
    src: `${import.meta.env.BASE_URL}media/BIB_diary.jpg`,
    mediaType: 'image',
    href: '/aseptic-bag-in-box',
  },
  {
    id: 'thermo-laminated-film',
    title: 'Environment-Friendly Mono-Material Solutions',
    category: 'Thermo-Laminated Film',
    src: `${import.meta.env.BASE_URL}media/mPet_TL.jpg`,
    mediaType: 'image',
    href: '/aseptic-packaging-materials',
  },
  {
    id: 'valve',
    title: 'Valve Catalog',
    category: 'Components',
    src: `${import.meta.env.BASE_URL}media/valves/12_most_common_valves.jpg`,
    mediaType: 'image',
    href: '/valve',
  },
  {
    id: 'open-close-video',
    title: 'Install Open / Close Lid',
    category: 'Video',
    src: `${import.meta.env.BASE_URL}media/Install_Open_Close_Lid.mp4`,
    poster: `${import.meta.env.BASE_URL}media/most_common_valves.jpg`,
    mediaType: 'video',
  },
  {
    id: 'tap-valve-video',
    title: 'Install Tap Valve',
    category: 'Video',
    src: `${import.meta.env.BASE_URL}media/Install_tap_valve.mp4`,
    poster: `${import.meta.env.BASE_URL}media/most_common_valves.jpg`,
    mediaType: 'video',
  },
];

const FeaturedProducts = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
          Explore aseptic bag, bag-in-box, IBC and custom-made solutions.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {featuredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <ProductCard {...product} />
          </motion.div>
        ))}
      </div>

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
