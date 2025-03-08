
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

// Featured products data
const featuredProducts = [
  {
    id: 'aseptic-bags',
    title: 'Premium Aseptic Bags',
    category: 'Bags',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=2215&auto=format&fit=crop'
  },
  {
    id: 'carton or IBC Containers',
    title: 'Luxury Gift Boxes',
    category: 'Boxes',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2024&auto=format&fit=crop'
  },
  {
    id: 'jewelry-packaging',
    title: 'Jewelry Packaging',
    category: 'Specialty',
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?q=80&w=2024&auto=format&fit=crop'
  },
  {
    id: 'retail-packaging',
    title: 'Retail Packaging Solutions',
    category: 'Retail',
    image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?q=80&w=2074&auto=format&fit=crop'
  }
];

const FeaturedProducts = () => {
  return (
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
            Discover our most popular packaging solutions designed to elevate your brand experience.
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
};

export default FeaturedProducts;
