import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import ProductCard, { ProductCardProps } from "@/components/ProductCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCTS } from "@/data/products";

const SITE_ORIGIN = "https://www.flexbo-packaging.com";
const PLACEHOLDER = "/tjn_location.jpg";

/**
 * EXTRA MEDIA TILES (e.g., demo videos) that should appear in the grid
 * alongside products.
 */
const EXTRA_MEDIA: ProductCardProps[] = [];

function absUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return `${SITE_ORIGIN}${PLACEHOLDER}`;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function toMetaDescription(text?: string, max = 160) {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s;
}

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
      src: p.images?.[0] ?? PLACEHOLDER,
      mediaType: "image",
    }));
    return [...productCards, ...EXTRA_MEDIA];
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return allCards;
    return allCards.filter((c) => c.category === activeCategory);
  }, [activeCategory, allCards]);

  const canonical = `${SITE_ORIGIN}/products`;
  const title = "Products | Flexbo Aseptic Bags, High-Barrier Laminates & IBC Packaging";
  const description = toMetaDescription(
    "Explore Flexbo packaging solutions: aseptic bags for liquid food, high-barrier laminates, bag-in-box and IBC packaging. Designed for safety, shelf-life and reliable global logistics."
  );

  // JSON-LD: ItemList of products
  const itemListJsonLd = useMemo(() => {
    const items = PRODUCTS.map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_ORIGIN}/products/${encodeURIComponent(p.id)}`,
      name: p.title,
      image: absUrl(p.images?.[0] ?? PLACEHOLDER),
    }));

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Flexbo Products",
      itemListElement: items,
    };
  }, []);

  return (
    <div className="pt-20">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        {/* OpenGraph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Flexbo Products" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />

        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(itemListJsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10"
          >
            <div className="text-center lg:text-left lg:max-w-3xl">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">Our Products</h1>

              <p className="mt-4 text-lg text-gray-600">
                Flexbo provides flexible packaging solutions for liquid food and industrial logistics
                including <strong>aseptic bags</strong>, <strong>high-barrier laminates</strong>,
                bag-in-box solutions and IBC packaging. Built for shelf-life, safety and performance.
              </p>

              <p className="mt-4 text-base text-gray-600">
                Browse by category to find the best fit for your filling line, distribution chain and
                barrier requirements.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end lg:flex-1">
              <img
                src={`${import.meta.env.BASE_URL}media/cert.png`}
                alt="Certification badge"
                className="w-full max-w-xs sm:max-w-sm lg:max-w-md object-contain"
                loading="lazy"
              />
            </div>
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
                <TabsList className="bg-gray-100 p-1 h-auto flex-wrap gap-2">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
            {filtered.map((card, index) => (
              <motion.div
                key={`${card.category}-${card.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 + index * 0.05 }}
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
