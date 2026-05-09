import SeoPageLayout, { SeoSection } from '@/components/SeoPageLayout';

const LiquidAsepticBags = () => {
  const sections: SeoSection[] = [
    {
      id: 'what-are-aseptic-bags',
      eyebrow: 'Guide',
      title: 'What are aseptic bags?',
      description:
        'Aseptic bags are sterilized flexible packs that hold juices, plant-based milks, flavor concentrates, dairy bases, or pharmaceutical liquids without refrigeration. Clean-room production, gamma irradiation, and food-grade laminates maintain sterility until the bag connects to filling equipment.',
      points: [
        'Sterility: production runs in ISO-class clean rooms with traceability from resin to finished bag.',
        'Multi-layer protection: PE strength layers, EVOH or foil for oxygen/light barrier, optional transparent designs for visual inspection.',
        'Fitment selection: wine/Olive-oil taps, 2-/ 3-inch glands, screw caps, and quick-connect valves.',
        'Outer support: corrugated cases, reusable bins, or IBC cages keep the collapsible bag safe during transport.',
      ],
      stats: [
        { label: 'Sizes', value: '3 L – 1500 L' },
        { label: 'Shelf life', value: '12–18 months at ambient' }
      ],
      image: {
        src: `${import.meta.env.BASE_URL}media/IBCBagHB22.jpg`,
        alt: 'Aseptic bag and outer support'
      }
    },
    {
      id: 'what-are-liquid-aseptic-bags',
      eyebrow: 'Liquid focus',
      title: 'What are liquid aseptic bags?',
      description:
        'Liquid aseptic bags specifically target pourable commodities that need oxygen protection, sterile connectors, \
        and efficient dispensing. Liquids such as wine, coffee concentrates, sauces, dairy, or water benefit from leak-proof taps and the ability to dispense without letting air back in.',
      points: [
        'Spouts with steam-sterilizable membranes ensure closed-loop filling.',
        'Tamper-proof taps keep components tethered for EU compliance.',
        'Universal self-sealing caps from improve hygiene for milk dispensers.',
        'E-commerce friendly bag-in-box formats resist parcel drop tests, reducing damage claims.',
      ],
      stats: [
        { label: 'Market size', value: '$4B (2025)' },
        { label: 'Forecast', value: '$6.4B by 2034' }
      ],
      image: {
        src: `${import.meta.env.BASE_URL}media/wine_v.jpg`,
        alt: 'Liquid aseptic bag tap'
      }
    }
  ];

  return (
    <SeoPageLayout
      hero={{
        eyebrow: 'Liquid Aseptic Bags',
        title: 'Liquid aseptic bag guide',
        subtitle:
          'Everything you need to know about liquid-focused aseptic bags, from barrier materials and taps to lead times \
           and filling compatibility.',
        stats: [
          { label: 'Lead time', value: '2–3 weeks' },
          { label: 'Barrier levels', value: 'Std / High / Very High' },
          { label: 'Applications', value: 'Beverage • Dairy • Pharma • Industrial' }
        ]
      }}
      sections={sections}
      relatedLinks={[
        {
          label: 'Liquid bags overview',
          to: '/liquid-bags#flexbo-liquid-bags',
          description: 'See how Flexbo deploys aseptic liners across industries.'
        },
        {
          label: 'Aseptic bag basics',
          to: '/aseptic-bags#what-are-aseptic-bags',
          description: 'Understand the sterile workflow behind each liner.'
        },
        {
          label: 'Packaging materials',
          to: '/aseptic-packaging-materials#what-materials-are-used-for-liquid-aseptic-bags',
          description: 'Material science deep dive on barriers and sustainability.'
        },
        {
          label: 'FAQ hub',
          to: '/faq/aseptic-bags#faq-liquid-aseptic-bags',
          description: 'Answers about lead times, barriers, and ordering.'
        }
      ]}
      cta={{
        title: 'Request a custom configuration',
        description: 'Provide your filling line, valve type, and annual volume so we can match the right film \
        structure and supply footprint.',
        buttonLabel: 'Get a quote',
        buttonTo: '/contact'
      }}
    />
  );
};

export default LiquidAsepticBags;
