import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, PlayCircle } from 'lucide-react';

const aboutFeatures = [
  'Clean-room manufacturing with AI-assisted quality control',
  'Italian thermo-lamination and patented film technology',
  'Global supply footprint with 1–3 week lead times',
];

const quickLinkCards = [
  {
    title: 'Liquid Aseptic Bags Market Overview',
    description: 'Learn how aseptic bags power beverage, dairy, and industrial logistics.',
    to: '/liquid-bags#flexbo-liquid-bags'
  },
  {
    title: 'Bag-in-Box Configurations',
    description: 'Explore taps, valves, and corrugated outers tailored to liquids.',
    to: '/aseptic-bag-in-box#what-are-the-benefits-of-bib-and-aseptic-bags'
  },
];

const AboutSection = () => {
  return (
    <section className="py-20 bg-gray-50" id="about">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Who we are
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Global innovation for flexible liquid packaging
              </h2>
              <p className="mt-4 text-gray-600">
                Flexbo Packaging supplies premium aseptic bags, bag-in-box systems, and IBC liners manufactured
                in clean-room facilities. Our Liquid Aseptic Bags experience and knowledge support
                beverage, dairy, and industrial brands deploy sterile and aseptic solutions worldwide.
              </p>
            </div>

            <div className="space-y-3">
              {aboutFeatures.map((feature) => (
                <div key={feature} className="flex items-start">
                  <CheckCircle className="text-primary mt-1 mr-3" size={20} />
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinkCards.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition"
                >
                  <p className="text-lg font-semibold text-gray-900">{card.title}</p>
                  <p className="mt-2 text-sm text-gray-600">{card.description}</p>
                </Link>
              ))}
            </div>

            <a
              href="/media/Flexbo_Introduction_EN.mp4"
              className="inline-flex items-center text-primary font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlayCircle size={20} className="mr-2" />
              Watch our introduction video
            </a>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="/media/Flexbo_Introduction_EN.jpg"
                alt="Flexbo facilities"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/10"></div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-6 w-56">
              <p className="text-3xl font-bold text-primary">1500L</p>
              <p className="text-sm text-gray-500">Maximum aseptic liner capacity</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
