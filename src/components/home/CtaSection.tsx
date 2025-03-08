
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CtaSection = () => {
  return (
    <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <img
          src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold sm:text-4xl mb-6">
            Ready to Elevate Your Brand Packaging?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Let's discuss how our premium packaging solutions can help your products stand out.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 rounded-md bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Contact Us Today
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
