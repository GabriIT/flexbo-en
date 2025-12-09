import { motion } from "framer-motion";

export default function Certifications() {
  return (
    <div className="pt-20">
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6}}
            className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">Certifications</h1>
            <p className="mt-4 text-lg text-gray-600">
              Our quality system and materials meet international standards for food safety and industrial logistics.
            Good Manufacturing Process (GMP), BRC, ISO, FDA, EU 10/2011, Halal, Kosher, FSC22000, ISO9001, ISO14001, 
            Bisphenol A, Nonylphenol (NP), Phtalate, Migrations, MOAH, covering most regions of the world requirements.
           <br />Certifications are available upon request.
            </p>
          </motion.div>
        </div>

      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-2">
          <CertCard title="ISO 9001, ISO 14001" details="Quality Management System." />
          <CertCard title="BRC " details="Food-contact manufacturing best practices." />
          <CertCard title="FDA Compliance" details="Materials compliant for specific food-contact uses." />
          <CertCard title="EU 10/2011" details="Materials intended to come into contact with food." />
        </div>
      </section>
    </div>
  );
}

function CertCard({ title, details }: { title: string; details: string }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{details}</p>
    </div>
  );
}
