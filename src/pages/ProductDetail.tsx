
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, RefreshCw, Package } from 'lucide-react';

// Sample products data (in a real app, this would be fetched from an API)
const products = [
  {
    id: 'BIB',
    title: 'Premium Barrier Bags',
    category: 'BIB',
    price: 'Euro 0.50 - 4.00',
    minOrder: '50 units',
    description: 'Our premium aseptic BIB bags are manufactured through automated processing, full Quality tracking through AI technology.',
    features: [
      'Sizes 1 Lt - 25 Lt with custom sizes and designs',
      'Eco-friendly materials',
      'Various spouts options',
      'Color printing optional'
    ],
    images: [
      '/media/HB_bags24.jpg',
      '/media/CustomMadeBags20.jpg',     
      '/media/diary_valves.jpg'
    ]
  },
  {
    id: 'ibc-packaging',
    title: 'Aseptic Bags',
    category: 'Aseptic Bags',
    price: 'Euro 1.20 - 8.00',
    minOrder: '2000 units',
    description: 'Long-term storage of liquid or high-viscosity foods or chemicals concentrates. Available in various sizes, and finishing options.',
    features: [
      'Sizes 50 Lt - 220 Lt with custom sizes and designs',
      'Eco-friendly materials',
      'Various spouts options',
      'Color printing optional'
    ],
    images: [
     '/media/aseptic_bag21.jpg',
      '/media/aseptic_bag14.jpg',
      '/media/BIB_transparent.jpg'
    ]
  },
  {
    id: 'ibc-packaging',
    title: 'IBC Packaging',
    category: 'IBC Packaging',
    price: 'Euro 6 - 30',
    minOrder: '50 units',
    description: 'Specialized and tailor-made packaging solutions for Industrial Bulk Containers (IBC)',
    features: [
      'Sizes 800 Lt - 1500 Lt with custom sizes and designs',
      'Eco-friendly materials',
      'Various spouts sizes, positions and auxiliary equipment options for waste savings ',
      'Color printing optional'
    ],
    images: [
      '/media/IBC_bag23.jpg',
      '/media/IBCBagHB22.jpg',
      '/media/IBC_Valves.jpg'
    ]
  },
  {
    id: 'high-barrier-laminates',
    title: 'Wide Thermo-laminated high barrier film',
    category: 'Laminated Film',
    price: 'Custom quote',
    minOrder: '1,000 meters',
    description: 'Custom-made Thermo-lamination machine 2400 mm wide, with high barrier properties for long-term storage of food and chemicals.',
    features: [
      'Customized solutions for different barrier, thickeness and technical film structures',
      'Eco-friendly processing and materials',
      'Suitable for Food, Chemicals, Electronics applications',
      'Fully-automated and Tracked manufcaturing process'
    ],
    images: [
      '/media/mPet_TL.jpg',
            
    ]
  }
];

// Benefits data
const benefits = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Quality Guaranteed',
    description: 'All our products undergo rigorous quality control.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Fast Production',
    description: 'Quick turnaround times for all orders.'
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: 'Sample Service',
    description: 'Test our products before full production.'
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: 'Custom Design',
    description: 'Tailored solutions for your brand needs.'
  }
];

const ProductDetail = () => {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const [product, setProduct] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Find the product based on the ID parameter
    const foundProduct = products.find(p => p.id === id);
    setProduct(foundProduct || null);
    setIsLoaded(true);
    // Reset active image when changing products
    setActiveImage(0);
  }, [id]);

  if (!isLoaded) {
    return <div className="min-h-screen pt-20 flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link 
          to="/products" 
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          View All Products
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link>
            <ChevronRight size={12} className="text-gray-400" />
            <Link to="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
            <ChevronRight size={12} className="text-gray-400" />
            <span className="text-gray-900 font-medium">{product.title}</span>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={product.images[activeImage]} 
                alt={product.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square rounded-md overflow-hidden border-2 ${
                    index === activeImage ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`${product.title} - View ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {product.category}
              </span>
              <h1 className="mt-1 text-3xl font-bold text-gray-900 sm:text-4xl">
                {product.title}
              </h1>
            </div>

            <div className="space-y-1 py-4 border-t border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Price Range:</span>
                <span className="text-sm text-gray-900">{product.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Minimum Order:</span>
                <span className="text-sm text-gray-900">{product.minOrder}</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Features</h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors w-full md:w-auto"
              >
                Request a Quote
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Benefits */}
        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Why Choose Our {product.title}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mt-16 p-8 bg-gray-900 text-white rounded-xl text-center"
        >
          <h2 className="text-2xl font-bold mb-4">
            Ready to Place an Order?
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Contact our team to discuss your specific requirements and get a custom quote for your {product.title} order.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 rounded-md bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Contact Us Today
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
