import SeoPageLayout, { SeoSection } from '@/components/SeoPageLayout';
import { faqData } from '@/data/faqData';

const buildFaqPoints = (category: string) =>
  faqData
    .filter((item) => item.category === category)
    .map((item) => `${item.question} ${item.answer}`);

const faqSections: SeoSection[] = [
  {
    id: 'faq-aseptic-bags',
    eyebrow: 'FAQ',
    title: 'FAQ – Aseptic bags',
    description:
      'These answers highlight how aseptic bags are produced, where they are used, and how to order them from Flexbo.',
    points: buildFaqPoints('General'),
  },
  {
    id: 'faq-liquid-aseptic-bags',
    eyebrow: 'FAQ',
    title: 'FAQ – Liquid aseptic bags',
    description:
      'Questions targeting liquid-focused performance, barrier choices, and connector availability.',
    points: buildFaqPoints('Specifications'),
  },
  {
    id: 'faq-liquid-aseptic-bib',
    eyebrow: 'FAQ',
    title: 'FAQ – Liquid aseptic BIB',
    description:
      'Ordering logistics, rush production, and typical response times when planning bag-in-box projects.',
    points: faqData
      .filter((item) => ['Ordering & Logistics', 'Support'].includes(item.category))
      .map((item) => `${item.question} ${item.answer}`),
  },
  {
    id: 'faq-quality',
    eyebrow: 'Quality',
    title: 'FAQ – Quality & certifications',
    description:
      'Shelf-life, quality control and materials.',
    points: buildFaqPoints('Quality & Compliance'),
  }
];

const FaqAsepticBags = () => {
  return (
    <SeoPageLayout
      hero={{
        eyebrow: 'FAQ',
        title: 'Aseptic bags FAQ',
        subtitle:
          'A curated set of Q&A covering applications, specs, ordering, and quality management.',
      }}
      sections={faqSections}
      relatedLinks={[
        {
          label: 'Aseptic bag guide',
          to: '/aseptic-bags#what-are-aseptic-bags',
        },
        {
          label: 'Liquid bag overview',
          to: '/liquid-bags#flexbo-liquid-bags',
        },
        {
          label: 'Contact Flexbo',
          to: '/contact',
        }
      ]}
    />
  );
};

export default FaqAsepticBags;
