import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Globe, Leaf } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Certified Quality',
    description: 'Manufactured in clean rooms with ISO, EU-Food-compliant, FDA, FSCC and GMP certifications.'
  },
  {
    icon: Zap,
    title: 'Fast Lead Times',
    description: 'Pallet orders ship in about a week and full containers in two/three, supporting just-in-time programs.'
  },
  {
    icon: Globe,
    title: 'Global Market Insight',
    description: 'We keep up with the Liquid Aseptic Bags Market requirements and dynamic changes \
    to secure alignment with emerging trends.'
  },
  {
    icon: Leaf,
    title: 'Sustainable Materials',
    description: 'Recycle-ready laminates, mono-material structures and spouts, high-barrier EVOH films\
    meet upcoming year 2030 PPWR (EU Packaging and Packaging Waste Regulation) targets.'
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
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Why Flexbo</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Built on research, automation, and sustainability
          </h2>
          <p className="mt-4 text-gray-600">
            Our manufacturing, material and design knowledge fuels smarter product development.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-gray-100 shadow-sm bg-gray-50"
              >
                <div className="text-primary mb-4">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
