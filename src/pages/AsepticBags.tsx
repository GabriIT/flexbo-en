import SeoPageLayout, { SeoSection } from '@/components/SeoPageLayout';

const AsepticBags = () => {
  const sections: SeoSection[] = [
    {
      id: 'what-are-aseptic-bags',
      eyebrow: 'Definition',
      title: 'What are aseptic bags?',
      description:
        'Aseptic bags are multi-layer flexible pouches sterilized through clean-room production, gamma irradiation, and food-grade material selection. \
        They are filled in closed systems to secure long shelf-life and to keep juices, dairy bases, purees, or industrial liquids safe at ambient temperature without preservatives.',
      points: [
        'Sizes from 2.5 L retail BIB to 1500 L tote liners, with form-fit options.',
        '40+ taps variety, screw caps, and 2-/3-inch aseptic glands for sterile filling and dispensing.',
        'Each bag is trackable from resin granule to finished product thanks to Flexbo quality protocols.',
      ],
      stats: [
        { label: 'Sterile assurance', value: 'Gamma-beamed, clean-room QA' },
        { label: 'Shelf-life', value: 'Up to 12–24 months' },
      ],
      image: {
        src: '/media/Flexbo_Introduction_EN.jpg',
        alt: 'Flexbo aseptic bag production'
      }
    },
    {
      id: 'what-are-liquid-aseptic-bags',
      eyebrow: 'Liquid packaging',
      title: 'What are liquid aseptic bags?',
      description:
        'Liquid aseptic bags add extra performance layers—barrier films, sterile connectors, and ergonomic boxes—to move valuable liquids globally. \
        The Liquid Aseptic Bags Market is expected to reach $6.4B by 2034 as brands swap single-use bottles for lighter bag-in-box formats.',
      points: [
        'Foil and EVOH barrier structures block oxygen, light, and moisture to curb oxidation.',
        'Spouts and taps can be sterilized by steam or peracetic acid just before filling.',
        'Rigid outers (corrugated boxes or IBC cages) provide stacking strength without compromising weight savings.',
        'Connected taps minimize air intake after opening, extending freshness for on-premise dispensers.',
      ],
      stats: [
        { label: 'Global CAGR', value: '~6–7% (2024–2034)' },
        { label: 'Spouts QA', value: ' 100% safe' },
      ],
      image: {
        src: '/media/BIB_transparent.jpg',
        alt: 'Bag-in-box tap dispensing'
      }
    }
  ];

  return (
    <SeoPageLayout
      hero={{
        eyebrow: 'Aseptic Bags',
        title: 'What are aseptic bags?',
        subtitle:
          'Your guide to sterilized bag-in-box systems, covering how they are built, filled, and used across beverages, dairy, and industrial liquids.',
        stats: [
          {
            label: 'Volume range', value: '2.5 L – 1500 L'
          },
          { label: 'Lead time', value: '1–3 weeks' },
          { label: 'Barrier options', value: 'Standard / High / Very High' }
        ]
      }}
      sections={sections}
      relatedLinks={[
        {
          label: 'Liquid bag applications',
          to: '/liquid-bags#flexbo-liquid-bags',
          description: 'Discover how materials and spouts are tailored per industry.'
        },
        {
          label: 'Bag-in-box benefits',
          to: '/aseptic-bag-in-box#what-are-bib',
          description: 'See why hybrid bag + corrugated packaging replaces rigid drums.'
        },
        {
          label: 'Materials deep dive',
          to: '/aseptic-packaging-materials#how-to-make-aseptic-bags',
          description: 'Understand the laminates, testing, and QA underpinning sterile bags.'
        },
        {
          label: 'FAQ library',
          to: '/faq/aseptic-bags#faq-aseptic-bags',
          description: 'Top questions in a searchable format.'
        }
      ]}
      cta={{
        title: 'Need help specifying aseptic packaging?',
        description: 'Send your filling machine, connector, and barrier requirements to the Flexbo team for a tailored quote.',
        buttonLabel: 'Contact Flexbo',
        buttonTo: '/contact'
      }}
    />
  );
};

export default AsepticBags;
