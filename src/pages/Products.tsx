
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const allProducts = [
  // Aseptic Bags
  {
    id: 'aseptic-bag-1',
    title: 'Luxury Aseptic Bags',
    category: 'Aseptic Bags',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=2215&auto=format&fit=crop'
  },
  {
    id: 'aseptic-bag-2',
    title: 'Kraft Aseptic Bags',
    category: 'Aseptic Bags',
    image: 'https://images.unsplash.com/photo-1572196284554-4e321b0e7e0b?q=80&w=2074&auto=format&fit=crop'
  },
  {
    id: 'aseptic-bag-3',
    title: 'Custom Print Aseptic Bags',
    category: 'Aseptic Bags',
    image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2071&auto=format&fit=crop'
  },
  
  // Boxes
  {
    id: 'box-1',
    title: 'Premium Gift Boxes',
    category: 'Boxes',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2024&auto=format&fit=crop'
  },
  {
    id: 'box-2',
    title: 'Rigid Setup Boxes',
    category: 'Boxes',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1988&auto=format&fit=crop'
  },
  {
    id: 'box-3',
    title: 'Folding Carton Boxes',
    category: 'Boxes',
    image: 'https://images.unsplash.com/photo-1531256379416-9f000e90aacc?q=80&w=2074&auto=format&fit=crop'
  },
  
  // Gift Packaging
  {
    id: 'gift-1',
    title: 'Luxury Gift Sets',
    category: 'Gift Packaging',
    image: 'https://images.unsplash.com/photo-1564144006388-615f376c3cb3?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'gift-2',
    title: 'Jewelry Packaging',
    category: 'Gift Packaging',
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?q=80&w=2024&auto=format&fit=crop'
  },
  {
    id: 'gift-3',
    title: 'Wine Packaging',
    category: 'Gift Packaging',
    image: 'https://images.unsplash.com/photo-1566060475410-1153add6c698?q=80&w=2071&auto=format&fit=crop'
  },
  
  // Custom Packaging
  {
    id: 'custom-1',
    title: 'Retail Packaging',
    category: 'Custom Packaging',
    image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?q=80&w=2074&auto=format&fit=crop'
  },
  {
    id: 'custom-2',
    title: 'Cosmetic Packaging',
    category: 'Custom Packaging',
    image: 'https://images.unsplash.com/photo-1619116712711-20cb2891b211?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'custom-3',
    title: 'Food Packaging',
    category: 'Custom Packaging',
    image: 'https://images.unsplash.com/photo-1603033156166-2ae22eb2b7e2?q=80&w=2069&auto=format&fit=crop'
  }
];

const categories = [
  { value: 'all', label: 'All Products' },
  { value: 'Aseptic Bags', label: 'Aseptic Bags' },
  { value: 'Boxes', label: 'Boxes' },
  { value: 'BIB', label: 'Bag-In_Box' },
  { value: 'Custom Packaging', label: 'Custom Packaging' }
];

const Products = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState(allProducts);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Filter products based on active category
    if (activeCategory === 'all') {
      setFilteredProducts(allProducts);
    } else {
      setFilteredProducts(allProducts.filter(product => product.category === activeCategory));
    }
  }, [activeCategory]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
              Our Products
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Discover our premium range of packaging solutions designed for brands that value quality and aesthetics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Listing */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 10 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
              <div className="flex justify-center">
                <TabsList className="bg-gray-100 p-1">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.value}
                      value={category.value}
                      className="text-sm px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <ProductCard {...product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Products;
