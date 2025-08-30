import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCTS } from "@/data/products";

/**
 * EXTRA MEDIA TILES (e.g., demo videos) that should appear in the grid
 * alongside products. Per your request, this video uses:
 *   - id: "aseptic-bags"
 *   - category: "Aseptic Bags"
 *
 * Clicking it will route to /products/aseptic-bags (same as the product),
 * because ProductCard links to /products/${id}.
 */
const EXTRA_MEDIA: ProductCardProps[] = [
  {
    id: "aseptic-bags",
    title: "Install: Open / Close Lid",
    category: "Aseptic Bags",
    src: "/media/Install_Open_Close_Lid.mp4",
    poster: "/media/Install_Open_Close_Lid.jpg",
    mediaType: "video",
  },
];

const PLACEHOLDER = "/media/placeholder.png";

export default function Products() {
  const [activeCategory, setActiveCategory] = useState("all");

  // categories derived from canonical data -> no manual drift
  const CATEGORIES = useMemo(() => {
    const base = Array.from(new Set(PRODUCTS.map((p) => p.category)));
    return [{ value: "all", label: "All Products" }, ...base.map((c) => ({ value: c, label: c }))];
  }, []);

  // Build a single list the grid will render (products + extra media)
  const allCards: ProductCardProps[] = useMemo(() => {
    const productCards: ProductCardProps[] = PRODUCTS.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      src: p.images[0] ?? PLACEHOLDER,
      mediaType: "image",
    }));
    return [...productCards, ...EXTRA_MEDIA];
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return allCards;
    return allCards.filter((c) => c.category === activeCategory);
  }, [activeCategory, allCards]);

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
              Our Products
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Discover our premium range of packaging solutions designed for brands that value
              quality and performance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Listing */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
              <div className="flex justify-center">
                <TabsList className="bg-gray-100 p-1 overflow-x-auto">
                  {CATEGORIES.map((category) => (
                    <TabsTrigger
                      key={category.value}
                      value={category.value}
                      className="text-sm px-4 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filtered.map((card, index) => (
              <motion.div
                key={`${card.category}-${card.id}-${index}`} // include index to avoid key clash with same id/category
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <ProductCard {...card} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
