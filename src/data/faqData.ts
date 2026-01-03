export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const faqData: FaqItem[] = [
  {
    question: 'What are aseptic bags used for?',
    answer:
      'They store and transport natural juices, dairy bases, concentrates, and other liquids at ambient temperature without preservatives, just as outlined in faq.csv. The sterile bag protects product integrity during long logistics legs.',
    category: 'General'
  },
  {
    question: 'What are the main features of Flexbo aseptic bags?',
    answer:
      'Each bag is produced in a clean room, food-grade, and gamma-beamed for sterility. Multiple oxygen-barrier structures let you match the hygiene class your filler or regulatory scheme requires.',
    category: 'General'
  },
  {
    question: 'Which bag sizes do you stock?',
    answer:
      'Standard liters include 2.5, 3, 5, 10, 20, 50, 100, 220, 1000, 1200, and 1500. Full-container flexitank formats are also supported for bulk movements.',
    category: 'Specifications'
  },
  {
    question: 'Do you supply different barrier levels?',
    answer:
      'Yes—standard, high, and very-high barrier laminations are available so formulators can choose the right balance between cost, protection, and shelf-life.',
    category: 'Specifications'
  },
  {
    question: 'Are connectors, spouts, and valves available?',
    answer:
      'There is a broad catalog of screw caps, wine/olive-oil-style taps, 2-/ 3- inch aseptic glands, and machine-ready quick-connectors so automatic or semi-automatic fillers can dock without leaking.',
    category: 'Specifications'
  },
  {
    question: 'Which raw materials go into your liquid bags?',
    answer:
      'Depending on the barrier, we combine LLDPE, HDPE, PET, EVOH, PA/BOPA, PP and Aluminum foil. All resins are food-contact compliant.',
    category: 'Specifications'
  },
  {
    question: 'What is Easysnap and why is it mentioned in the FAQ?',
    answer:
      'Easysnap is the Italian mono-dose liquid filling technology that opens with one hand; Flexbo integrates it for customers who need portion packs alongside larger bags.',
    category: 'Technology'
  },
  {
    question: 'Can we order liquid bags directly from Flexbo?',
    answer:
      'Absolutely. We sell pallets or full containers worldwide and support direct shipments from Tianjin or European partners for short lead times.',
    category: 'Ordering & Logistics'
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Just-in-time production plus large capacity means orders typically ship within one week, stretching to three or four weeks only for complex or very-high-barrier builds.',
    category: 'Ordering & Logistics'
  },
  {
    question: 'Do you offer rush production?',
    answer:
      'Yes. When projects are urgent, let us know the reason and we can schedule quick production, as indicated in the FAQ list.',
    category: 'Ordering & Logistics'
  },
  {
    question: 'How do I place a bulk order?',
    answer:
      'Send the volume, barrier, and connector requirements by email or phone (contacts are on the Contact page). Our sales team replies within 24 hours per the FAQ commitment.',
    category: 'Ordering & Logistics'
  },
  {
    question: 'What shelf-life can I expect from aseptic bags?',
    answer:
      'If your product is pasteurized and filled on best-in-class machinery, shelf-life beyond 12 months (up to 24 months) at environmental temperatures is achievable with high-barrier films.',
    category: 'Quality & Compliance'
  },
  {
    question: 'How do you ensure product quality and traceability?',
    answer:
      'We maintain full traceability from granule to finished bag. Every lot passes periodic mechanical and barrier tests aligned with EU, FDA, and GMP certifications.',
    category: 'Quality & Compliance'
  },
  {
    question: 'What does your quality control process look like?',
    answer:
      'A dedicated laboratory and tailor-made fatigue rigs stress the seams, spouts, and laminates so potential failure modes are caught before shipment.',
    category: 'Quality & Compliance'
  },
  {
    question: 'What is your typical response time for inquiries?',
    answer:
      'We reply within 24 hours. For urgent cases, customers can escalate via the contact details provided on the Contact page.',
    category: 'Support'
  }
];

export default faqData;
