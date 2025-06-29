
import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
        <img
          src="https://images.unsplash.com/photo-1605152276897-4f618f831968?q=80&w=2070&auto=format&fit=crop"
          alt="Premium Packaging"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-3xl space-y-6">
          <span
            className={`inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium tracking-wide transition-all duration-1000 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            High Quality Packaging Solutions for Liquid Ingredients and Food Applications
          </span>

          <h2
            className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight transition-all duration-1000 delay-150 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            Aseptic Packaging Solutions<br /> High Barrier Bags and Flexible IBC Container For Storage and Transportation
          </h2>

          <p
            className={`text-lg md:text-xl text-white/80 max-w-xl transition-all duration-1000 delay-300 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            Secure your concentrated products with our premium aseptic packaging solutions designed and produced with <br /> state-of-the-art
            Technology, Quality and the best selection of raw materials.
          </p>

          <div
            className={`pt-4 flex flex-wrap gap-4 transition-all duration-1000 delay-500 ease-out ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <Link
              to="/products"
              className="inline-flex items-center px-5 py-3 rounded-md bg-white text-gray-900 font-medium text-sm transition-all hover:shadow-lg hover:bg-gray-50"
            >
              Explore Products
              <ChevronRight size={16} className="ml-1" />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center px-5 py-3 rounded-md bg-white/10 backdrop-blur-sm text-white font-medium text-sm transition-all hover:bg-white/20"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
