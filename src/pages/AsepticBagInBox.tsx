import SeoPageLayout, { SeoSection } from '@/components/SeoPageLayout';

const AsepticBagInBox = () => {
  const sections: SeoSection[] = [
    {
      id: 'what-are-bib',
      eyebrow: 'Bag-in-box 101',
      title: 'What are bag-in-box (BIB) systems?',
      description:
        'Bag-in-box systems pair a flexible aseptic liner with a rigid outer box or tote. \
        The bag collapses as liquid is dispensed, preventing oxygen ingress, while the carton provides stacking strength and branding.',
      points: [
        'Form-fit liners eliminate headspace and glugging, improving product evacuation.',
        'Pillow bags remain a cost-effective choice for bulk and commodity liquids.',
        'Corrugated outers are often >75% recycled content, supporting low-carbon goals.',
        'Provided with taps, spouts or screw caps to keep oxygen out until use.',
      ],
      image: {
        src: `${import.meta.env.BASE_URL}media/CustomMadeBags20.jpg`,
        alt: 'Bag-in-box assembly'
      }
    },
    {
      id: 'what-are-the-benefits-of-bib-and-aseptic-bags',
      eyebrow: 'Benefits',
      title: 'What are the benefits of BIB and aseptic bags?',
      description:
        'Compared to glass bottles or rigid jugs, BIB delivers lighter weight, lower emissions, better inventory density, and hygienic dispensing. \
         e-commerce and foodservice operations switch to BIB to slash damage and waste.',
      points: [
        'Sustainability: 60% lighter than equivalent glass packaging and 94% less solid waste when shipped flat.',
        'Cost efficiency: fewer changeovers, automated case erecting, and lower Extended Producer Responsibility fees.',
        'Freshness: self-venting taps limit air ingress so wines or juices stay fresh for weeks after opening.',
        'Versatility: options for beverages, dairy, industrial chemicals, and home-care liquids.',
      ],
      stats: [
        { label: 'Market forecast', value: '$6.4B by 2034' },
        { label: 'APAC growth', value: '~9% CAGR' },
      ],
      image: {
        src: `${import.meta.env.BASE_URL}media/Flexbo_Introduction_EN.jpg`,
        alt: 'Bag-in-box logistics'
      }
    }
  ];

  return (
    <SeoPageLayout
      hero={{
        eyebrow: 'Aseptic Bag-in-Box',
        title: 'Bag-in-box advantages for liquids',
        subtitle:
          'Understand BIB configurations, a large spout variation and UN-rated form-fit liners, and why brands rely on them to ship beverages, dairy, and concentrates globally.',
        stats: [
          { label: 'Box sizes', value: '2.5 L – 25 L retail' },
          { label: 'Bulk liners', value: '200 L – 1500 L' },
          { label: 'Lead time', value: '1–3 weeks' }
        ]
      }}
      sections={sections}
      relatedLinks={[
        {
          label: 'Aseptic bag fundamentals',
          to: '/aseptic-bags#what-are-aseptic-bags',
          description: 'Brush up on sterile bag construction before selecting a BIB combo.'
        },
        {
          label: 'Liquid bag focus',
          to: '/liquid-bags#flexbo-liquid-bags',
          description: 'See case studies from beverage, dairy, and industrial liquids.'
        },
        {
          label: 'FAQ for BIB buyers',
          to: '/faq/aseptic-bags#faq-liquid-aseptic-bib',
          description: 'Answers to pricing, MOQ, and connector planning from faq.csv.'
        }
      ]}
      cta={{
        title: 'Plan a bag-in-box rollout',
        description: 'Share your dispensing environment and logistics goals so we can pair the best liner, tap, and outer structure.',
        buttonLabel: 'Discuss with Flexbo',
        buttonTo: '/contact'
      }}
    />
  );
};

export default AsepticBagInBox;
