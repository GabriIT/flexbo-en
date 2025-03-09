import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Globe, Leaf, Award, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Values data
const values = [
  {
    icon: <CheckCircle size={24} className="text-primary" />,
    title: 'Quality Assurance',
    description: 'We maintain rigorous quality control at every stage of production.'
  },
  {
    icon: <Leaf size={24} className="text-primary" />,
    title: 'Sustainability',
    description: 'Committed to eco-friendly materials and sustainable production methods.'
  },
  {
    icon: <Globe size={24} className="text-primary" />,
    title: 'Global Standards',
    description: 'Our products meet international quality and safety standards.'
  },
  {
    icon: <Users size={24} className="text-primary" />,
    title: 'Customer Focus',
    description: 'We tailor our services to meet each client\'s specific needs and vision.'
  }
];

// Timeline data
const timeline = [
  {
    year: '2012',
    title: 'Company Founded',
    description: 'Started as a small clean room workshop with a vision for quality aseptic packaging relying on Italian packaging technology.'
  },
  {
    year: '2014',
    title: 'International Expansion',
    description: 'Serving mainly European clients, establishing global partnerships.'
  },

  {
    year: '2015',
    title: 'First Asian Giant Themo-Lamination machine',
    description: 'Serving mainly European clients, establishing global partnerships.'
  },

  {
    year: '2016',
    title: 'Invention Patents and Sustainability Initiative',
    description: 'Launched new patented inventions for eco-friendly solutions, focusing on sustainable materials.'
  },
  {
    year: '2017',
    title: 'Modern Facility',
    description: 'Moved to a larger production facility with state-of-the-art equipment.'
  },
  {
    year: '2018',
    title: 'Three Invention Patents and Design Innovation Award',
    description: 'Recognized for excellence in packaging design and innovation.'
  },
  {
    year: '2025',
    title: 'Digital Transformation',
    description: 'Implemented digital design and production processes for greater efficiency.'
  }
];

const About = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative bg-gray-50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
              About Us
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              We're dedicated to creating B2B packaging solutions that secure products integrity in global logistics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1605000798985-4c28c779cc2e?q=80&w=2071&auto=format&fit=crop" 
                alt="Our Workshop" 
                className="rounded-lg shadow-lg w-full"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg hidden md:block">
                <Award size={40} className="text-primary" />
                <p className="mt-2 font-medium text-sm text-gray-900">Excellence in Packaging</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Our Story
              </span>
              <h2 className="text-3xl font-bold text-gray-900">
                Creating Premium Packaging Since 2012
              </h2>
              <p className="text-gray-600">
                Flexbo Packaging was founded with a mission to provide reliable, effective and environment-friendly 
                packaging solutions. Over the years, we've developed new technologies becoming a global packaging partner serving clients around the world.
              </p>
              <p className="text-gray-600">
                Our journey has been driven by innovation, quality, environment-consciousness. 
                We secure that large and small packaging is a safe and
                reliable tool for moving and store goods in a global economy.
              </p>
              <p className="text-gray-600">
                Today, we continue to push the boundaries of packaging design and manufacturing,
                utilizing sustainable materials and cutting-edge technology to create
                performing and efficient solutions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Our Values
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              What Drives Us Forward
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our core values shape every decision we make and every product we create.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-sm"
              >
                <div className="mb-4">{value.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Our Journey
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Company Timeline
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Milestones that have shaped our growth and evolution over the years.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200 hidden md:block"></div>
            
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } items-center`}
                >
                  <div className="md:w-1/2 flex flex-col items-center md:items-end md:pr-12 md:text-right">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                      {item.year}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white z-10 my-4 md:my-0">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  
                  <div className="md:w-1/2 md:pl-12 hidden md:block"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Want to Work Together?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Reach out to discuss your packaging needs and how we can help bring your vision to life.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Contact Us
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
