
import { motion } from 'framer-motion';
import { Package2, Zap, Truck, Users } from 'lucide-react';

// Features data
const features = [
  {
    icon: <Package2 className="w-6 h-6" />,
    title: 'Premium Materials',
    description: 'Sourced from sustainable suppliers with quality in mind.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Custom Designs',
    description: 'Tailored solutions that reflect your brand identity.'
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: 'Global Shipping',
    description: 'Efficient delivery to your warehouse anywhere in the world.'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Expert Support',
    description: 'Our team provides guidance through the entire process.'
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Why Choose Us
          </span>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Our Commitment to Excellence
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            We go beyond creating packaging - we help build memorable brand experiences.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg border border-gray-100 bg-white hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
