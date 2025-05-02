
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const AboutSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              About Us
            </span>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Manufacturing Aseptic Packaging Since 2012            </h2>
            <p className="text-lg text-gray-600">
              At Flexbo Packaging, we combine traditional craftsmanship with modern technology to create packaging solutions that stand out. Our commitment to quality and sustainability drives every decision we make.
            </p>
            <p className="text-gray-600">
              With a global client base spanning retail, cosmetics, food, and more, we understand the importance of packaging in transportation, storage and securing your brand value.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-primary transition-colors"
            >
              Learn More About Us
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative aspect-video lg:aspect-square overflow-hidden rounded-lg"
          >
            <img
              src="https://images.unsplash.com/photo-1628566880119-0a035ee1ae72?q=80&w=2068&auto=format&fit=crop"
              alt="Our Workshop"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
