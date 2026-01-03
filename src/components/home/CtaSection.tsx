import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CtaSection = () => {
  return (
    <section className="py-20 bg-primary text-white relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-sm uppercase tracking-widest text-white/80">
            Let’s plan your next aseptic packaging run
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
            Ready to secure your product for global logistics ?
          </h2>
          <p className="mt-6 text-lg text-white/90">
            Share your liquid, connector, and barrier requirements. We will combine insights
            and know-how to recommend the optimal bag-in-box or IBC liner setup.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-6 py-3 mt-8 bg-white text-primary font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition"
          >
            Contact us today
            <ArrowRight className="ml-2" size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
