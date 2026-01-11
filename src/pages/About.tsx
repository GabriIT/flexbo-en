import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const SITE_ORIGIN = "https://www.flexbo-packaging.com";

export default function About() {
  const canonical = `${SITE_ORIGIN}/about`;
  const title = "About Flexbo | Aseptic Packaging & High-Barrier Flexible Solutions";
  const description =
    "Flexbo provides B2B flexible packaging solutions for liquid food and industrial logistics, including aseptic bags and high-barrier laminates designed for shelf-life, safety and performance.";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Flexbo",
    url: SITE_ORIGIN,
    description,
    logo: `${SITE_ORIGIN}/favicon.ico`,
  };

  return (
    <div className="pt-20 pb-16">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="About Flexbo" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />

        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">About Flexbo</h1>
            <p className="mt-5 text-lg text-gray-700">
              We design and supply <strong>aseptic packaging</strong> and <strong>high-barrier</strong> flexible
              solutions for safe global logistics — focused on quality, performance and reliable supply.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Explore Products
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-white text-gray-900 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900">What we do</h2>
              <p className="text-gray-700">
                Flexbo supports brands and industrial partners with flexible packaging solutions that protect liquids during filling, shipping and storage. Our focus includes aseptic bags and high-barrier laminated structures designed to help extend shelf-life and maintain product quality.
              </p>

              <h3 className="text-xl font-semibold text-gray-900">Aseptic packaging focus</h3>
              <p className="text-gray-700">
                Aseptic packaging is a system approach: sterilized product, sterilized packaging, controlled filling and barrier protection. When designed correctly, it helps reduce contamination risk and supports stable distribution chains.
              </p>

              <h3 className="text-xl font-semibold text-gray-900">How we help</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Product selection guidance (aseptic bags, bag-in-box, IBC liners, high-barrier laminates)</li>
                <li>Specification alignment for barrier, shelf-life, logistics and handling</li>
                <li>Support for sampling, iterations and scaling</li>
              </ul>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="p-6 rounded-xl bg-gray-50 border border-gray-100 space-y-4"
            >
              <h3 className="text-lg font-semibold text-gray-900">Quick facts</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <span className="font-medium">Domain:</span> flexbo-packaging.com
                </p>
                <p>
                  <span className="font-medium">Brand:</span> Flexbo
                </p>
                <p>
                  <span className="font-medium">Core topics:</span> aseptic bags, high-barrier laminates, liquid packaging
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center w-full px-5 py-3 rounded-md bg-white text-gray-900 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Browse products
                </Link>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </div>
  );
}
