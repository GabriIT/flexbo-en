
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// src/types/product.ts       (or put it at the top of Products.tsx)
export type MediaType = 'image' | 'video';

export interface Product {
  id: string;
  title: string;
  category: string;
  src: string;          // image or video file
  mediaType: MediaType; // tells <ProductCard> how to render it
  poster?: string;      // ← add this (optional = ?)

}


// Products.tsx  – top of the file
const allProducts: Product[] = [
  // ─── Aseptic Bags ────────────────────────────────────────────
  {
    id: 'aseptic-bag-1',
    title: 'Aseptic Bags',
    category: 'Aseptic Bags',
    src: '/media/aseptic_bag14.jpg',   // ← rename image→src
    mediaType: 'image',               // ← tell the card it’s an image
  },
  {
    id: 'aseptic-bag-2',
    title: 'High Barrier Aseptic Bags',
    category: 'Aseptic Bags',
    src: '/media/CustomMadeBags20.jpg',
    mediaType: 'image',
  },

  // ─── IBC ─────────────────────────────────────────────────────
  {
    id: 'IBC-1',
    title: 'IBC Bags',
    category: 'IBC Containers',
    src: '/media/IBC_bag23.jpg',
    mediaType: 'image',
  },
  {
    id: 'IBC-2',
    title: 'Industrial Bulk Containers',
    category: 'Industrial Bulk Containers IBC Valves',
    src: '/media/IBC_Valves.jpg',
    mediaType: 'image',
  },

  // ─── Bag-in-Box ──────────────────────────────────────────────
  {
    id: 'gift',
    title: 'Wine/Oil/Dairy Packaging',
    category: 'BIB',
    src: '/media/HB_bags24.jpg',
    mediaType: 'image',
  },

  // ─── Film ────────────────────────────────────────────────────
  {
    id: 'Thermo-Laminated Film',
    title: 'Thermo-Laminated Film',
    category: 'Thermo-Laminated Film',
    src: '/media/mPet_TL.jpg',
    mediaType: 'image',
  },

  // ─── Videos (already correct) ───────────────────────────────
  // {
  //   id: 'video-lid',
  //   title: 'Install: Open / Close Lid',
  //   category: 'VIDEO Istruzione Bocchello Apri-Chiudi',
  //   src: '/media/Install_Open_Close_Lid.mp4',
  //   mediaType: 'video',
  // },


  {
    id: 'video-lid',
    title: 'Install: Open / Close Lid',
    category: 'Videos',
    src: '/media/Install_Open_Close_Lid.mp4',
    poster: '/media/Install_Open_Close_Lid.jpg',   // <- quick thumbnail
    mediaType: 'video',
  },

  {
    id: 'video-tap-valve',
    title: 'Install Tap Valve',
    category: 'VIDEO Istruzione Installazione Rubinetto',
    src: '/media/Install_tap_valve.mp4',
    mediaType: 'video',
  },
];


const categories = [
  { value: 'all', label: 'All Products' },
  { value: 'Aseptic Bags', label: 'Aseptic Bags' },
  { value: 'IBC Containers', label: 'IBC Containers' },
  { value: 'BIB', label: 'Bag-In-Box' },
  { value: 'Thermo-Laminated Film', label: 'Thermo-Laminated Film' }
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
