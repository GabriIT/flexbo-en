import SeoPageLayout, { SeoSection } from '@/components/SeoPageLayout';

const LiquidBags = () => {
  const sections: SeoSection[] = [
    {
      id: 'flexbo-liquid-bags',
      eyebrow: 'Sterile performance',
      title: 'Engineered for ambient logistics and premium taps',
      description:
        'Our Liquid Aseptic Bags Market research confirms that modern bag-in-box systems cover everything from 2.5 L retail packs to 1500 L tote liners. Flexbo manufactures both pillow and form-fit bags, combining polyethylene strength layers with aluminum or EVOH barriers so beverages, dairy bases, and concentrates remain stable for 6–18 months without preservatives.',
      points: [
        'Volume flexibility: 2.5–20 L retail, 200 L drums, and up to 1000–1500 L tote liners with optional flexitanks.',
        'Barrier choice: foil laminates for light/oxygen blocking or recycle-ready mono-material structures for brands targeting PPWR compliance.',
        'Fitments for every workflow: wine taps, screw caps, and 2- or 3-inch aseptic glands for industrial fillers.',
        'High-speed compatibility: the same bags run on most of automatic aseptic liquid fillers delivering up to 140 x 5 L bags per hour.',
      ],
      stats: [
        { label: 'Shelf-life', value: 'up to 24 months' },
        { label: 'Bag styles', value: 'Pillow & form-fit' },
        { label: 'Delivery', value: '2–4 weeks' },
      ],
      image: {
        src: '/media/aseptic_bag14.jpg',
        alt: 'Flexbo liquid aseptic bags'
      }
    },
    {
      id: 'global-industries',
      eyebrow: 'Market adoption',
      title: 'Trusted across beverage, dairy, and industrial supply chains',
      description:
        'The global bag-in-box and aseptic bag market was valued near $4B in 2025 and is forecast to reach $6.4B by 2034 (≈6–7% CAGR). Europe still drives 40% of consumption thanks to wine, while Asia-Pacific grows >9% annually as dairy, coffee, and cleaning concentrates pivot to lighter packaging. Flexbo supports both food and non-food formulations with traceability and EU/FDA/GMP certifications.',
      points: [
        'Food & beverage: wines, juices, cold brew, and plant-based milks enjoy fewer oxidized returns because taps limit air ingress after opening.',
        'Foodservice & hospitality: 10–20 L aseptic bags feed dispensers, swapping heavy jugs for ergonomic boxes and leak-proof valves.',
        'Industrial & non-food: UN-rated and anti-static liners protect chemicals, personal-care concentrates, and home-care detergents.',
        'Just-in-time fulfillment: pallets ship in about a week and full containers in two, keeping inventory lean.',
      ],
      stats: [
        { label: 'Europe market share', value: '≈40% (2024)' },
        { label: 'APAC growth', value: '~ 9% CAGR' },
        { label: 'Global volume', value: '>2B liters/year' },
      ],
      image: {
        src: '/media/BIB_diary.jpg',
        alt: 'Bag-in-box usage in dairy and beverage operations'
      }
    }
  ];

  return (
    <SeoPageLayout
      hero={{
        eyebrow: 'Liquid Bags',
        title: 'Liquid aseptic bags for resilient global supply chains',
        subtitle:
          'From 2.5 L foodservice packs to 1500 L tote liners, Flexbo combines Italian technology, sterile clean-room production, and AI-assisted QA to keep liquids secure during transport.',
        stats: [
          { label: 'Volume range', value: '2.5 L – 1500 L' },
          { label: 'Global CAGR', value: '6–7% through 2034' },
          { label: 'Logistics lead time', value: '2–4 weeks' }
        ]
      }}
      sections={sections}
      relatedLinks={[
        {
          label: 'What are aseptic bags?',
          to: '/aseptic-bags#what-are-aseptic-bags',
          description: 'Definition, sterilization steps, and where they fit in your line.'
        },
        {
          label: 'Liquid aseptic bag guide',
          to: '/liquid-aseptic-bags#what-are-liquid-aseptic-bags',
          description: 'Dive into the films, connectors, and fillers tailored to liquids.'
        },
        {
          label: 'Bag-in-box benefits',
          to: '/aseptic-bag-in-box#what-are-the-benefits-of-bib-and-aseptic-bags',
          description: 'Compare taps, box ergonomics, and sustainability metrics.'
        },
        {
          label: 'Packaging materials',
          to: '/aseptic-packaging-materials#what-materials-are-used-for-liquid-aseptic-bags',
          description: 'Explore the resins, laminates, and testing regimen behind each liner.'
        },
        {
          label: 'Targeted FAQ',
          to: '/faq/aseptic-bags#faq-liquid-aseptic-bags',
          description: 'Top questions about liquid bags and BIB in plain English.'
        }
      ]}
      cta={{
        title: 'Ready to specify your next aseptic bag order?',
        description: 'Share the barrier class, spouts, connector, and batch size, and our engineers will provide a tailored configuration plus lead-time confirmation.',
        buttonLabel: 'Talk to Flexbo',
        buttonTo: '/contact'
      }}
    />
  );
};

export default LiquidBags;
