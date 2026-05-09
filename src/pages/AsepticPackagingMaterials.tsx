import SeoPageLayout, { SeoSection } from '@/components/SeoPageLayout';

const AsepticPackagingMaterials = () => {
  const sections: SeoSection[] = [
    {
      id: 'how-to-make-aseptic-bags',
      eyebrow: 'Process',
      title: 'How to make aseptic bags',
      description:
        'Manufacturing aseptic bags requires precision—from resin selection to lamination, clean-room forming, and gamma sterilization. Flexbo combines Italian thermo-lamination machines (introduced in 2015) with AI-assisted inspection to guarantee every layer and seam meets EU/FDA/GMP standards.',
      points: [
        'Film extrusion and lamination: PE strength layers, EVOH/PA barrier cores, optional aluminum foil, and surface films.',
        'Valve and gland insertion: connectors are welded in sterile environments to ensure leak-proof seals.',
        'Gamma or electron-beam treatment: kills residual microbes before bags reach filling lines.',
        'Traceability: each batch has full history from granule to final inspection.',
      ],
      stats: [
        { label: 'Innovation milestones', value: '5 patents, digital QA management (2025)' },
        { label: 'Clean-room class', value: 'ISO-grade production' },
      ],
      image: {
        src: `${import.meta.env.BASE_URL}media/HB_bags24.jpg`,
        alt: 'Aseptic bag production line'
      }
    },
    {
      id: 'what-materials-are-used-for-liquid-aseptic-bags',
      eyebrow: 'Material science',
      title: 'What materials are used for liquid aseptic bags?',
      description:
        'Flexbo relies on LLDPE, HDPE, PET, EVOH, PA/BOPA, PP and aluminum. Selecting the right combination balances strength, sealing temperature, oxygen barrier, and recyclability.',
      points: [
        'LLDPE/HDPE: provide toughness and dart impact resistance for transport.',
        'EVOH & PA/BOPA: supply high oxygen barrier while remaining flexible.',
        'Aluminum foil: delivers near-zero oxygen/light transmission for premium wines and high pH concentrates.',
        'Mono-material innovations: mono-material-layers or all-PE structures for easier recycling.',
      ],
      stats: [
        { label: 'Barrier classes', value: 'Std / High / Very High' },
        { label: 'Recyclability', value: '95% recyclable designs' },
      ],
      image: {
        src: `${import.meta.env.BASE_URL}media/mPet_TL.jpg`,
        alt: 'Multi-layer films'
      }
    }
  ];

  return (
    <SeoPageLayout
      hero={{
        eyebrow: 'Aseptic Packaging Materials',
        title: 'Materials behind sterile performance',
        subtitle:
          'Explore the laminates, coatings, and QA steps that make aseptic bags work for food, beverage, and industrial liquids.',
        stats: [
          { label: 'Material palette', value: 'PE • PET • EVOH • PA • PP • Foil' },
          { label: 'Testing', value: 'Laboratory fatigue + barrier tests' },
          { label: 'Compliance', value: 'EU • FDA • GMP' }
        ]
      }}
      sections={sections}
      relatedLinks={[
        {
          label: 'Aseptic bag overview',
          to: '/aseptic-bags#what-are-aseptic-bags',
          description: 'Learn how the materials come together in end products.'
        },
        {
          label: 'Bag-in-box benefits',
          to: '/aseptic-bag-in-box#what-are-the-benefits-of-bib-and-aseptic-bags',
          description: 'See how film choices translate to logistics wins.'
        },
        {
          label: 'Liquid bag use cases',
          to: '/liquid-bags#flexbo-liquid-bags',
          description: 'Connect material options with actual industries served.'
        }
      ]}
      cta={{
        title: 'Pick the right barrier structure',
        description: 'Tell us about your product’s pH, temperature, required shelf-life and filling process so we can recommend the exact laminate and spouts.',
        buttonLabel: 'Request materials advice',
        buttonTo: '/contact'
      }}
    />
  );
};

export default AsepticPackagingMaterials;
