import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

const valves = [
  { id: 'valve-01', code: 'F01', description: 'Dairy 1"', image: `${import.meta.env.BASE_URL}media/valves/01_Dairy.jpg` },
  { id: 'valve-02', code: 'F02', description: 'Intasept', image: `${import.meta.env.BASE_URL}media/valves/02_Intasept.jpg` },
  { id: 'valve-03', code: 'F03', description: 'Retail', image: `${import.meta.env.BASE_URL}media/valves/03_Retail.jpg` },
  { id: 'valve-04', code: 'F04', description: 'Wine / Olive Oil', image: `${import.meta.env.BASE_URL}media/valves/04_Wine_Olive_Oil.jpg` },
  { id: 'valve-05', code: 'F05', description: '1" Various', image: `${import.meta.env.BASE_URL}media/valves/05_1_Inch.jpg` },
  { id: 'valve-06', code: 'F06', description: '2" IBC', image: `${import.meta.env.BASE_URL}media/valves/06_2_Inch_IBC.jpg` },
  { id: 'valve-07', code: 'F07', description: 'Discharge 2"', image: `${import.meta.env.BASE_URL}media/valves/07_Discharge_2_Inch_Valve.jpg` },
  { id: 'valve-08', code: 'F08', description: '1" Elpo', image: `${import.meta.env.BASE_URL}media/valves/08_1_Inch_Elpo.jpg` },
  { id: 'valve-09', code: 'F09', description: '2", 3 Filler" IBC', image: `${import.meta.env.BASE_URL}media/valves/09_2_3_Inches_IBC.jpg` },
  { id: 'valve-10', code: 'F10', description: 'Franrica 2"', image: `${import.meta.env.BASE_URL}media/valves/10_Franrica_2_Inches.jpg` },
  { id: 'valve-11', code: 'F11', description: '1" Dairy with Tube', image: `${import.meta.env.BASE_URL}media/valves/11_1_Inch_Dairy_with_Tube.jpg` },
  { id: 'valve-12', code: 'F12', description: '1" Various', image: `${import.meta.env.BASE_URL}media/valves/12_most_common_valves.jpg` },
];

const Valve = () => {
  return (
    <div className="pt-20 bg-white">
      <Helmet>
        <title>Spouts and Valves | Flexbo</title>
        <meta
          name="description"
          content="A large portfolio of valves and spouts for all requirements."
        />
      </Helmet>

      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              Components
            </p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">
              Spouts and Valves
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              A large portfolio of valves and spouts for all requirements
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {valves.map((valve, index) => (
              <motion.div
                key={valve.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="h-full rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-4">
                    <img
                      src={valve.image}
                      alt={`${valve.description} valve`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-sm font-semibold text-gray-900">{valve.code}</p>
                    <p className="mt-1 text-sm text-gray-600">{valve.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Valve;
