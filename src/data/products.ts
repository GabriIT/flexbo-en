// src/data/products.ts
export type Product = {
  id: string;            // slug used in /products/:id
  title: string;
  category: string;      // used by the tabs filter
  price?: string;
  minOrder?: string;
  description?: string;
  features?: string[];
  images: string[];      // image gallery on the detail page
};

export const PRODUCTS: Product[] = [
  {
    id: "aseptic-bags",
    title: "Aseptic Bags",
    category: "Aseptic Bags",
    price: "Euro 1.20 - 8.00",
    minOrder: "2000 units",
    description:
      "Long-term storage of liquid/high-viscosity foods and chemicals; multiple sizes and finishes.",
    features: [
      "Sizes 50–220 L, custom sizes",
      "Eco-friendly materials",
      "Spout options",
      "Optional color printing",
    ],
    images: ["/media/asepticBags21.jpg", "/media/aseptic_bag14.jpg", "/media/BIB_transparent.jpg"],
  },
  {
    id: "ibc-packaging",
    title: "IBC Packaging",
    category: "IBC Containers",
    price: "Euro 6 - 30",
    minOrder: "50 units",
    description:
      "Tailor-made liners and equipment for Industrial Bulk Containers (IBC).",
    features: [
      "Sizes 800–1500 L, custom designs",
      "Eco-friendly materials",
      "Spout sizes/positions and auxiliaries for waste savings",
      "Optional color printing",
    ],
    images: ["/media/IBC_bag23.jpg", "/media/IBCBagHB22.jpg", "/media/IBC_Valves.jpg"],
  },
  {
    id: "bib",
    title: "Premium Barrier Bags",
    category: "BIB",
    price: "Euro 0.50 - 4.00",
    minOrder: "50 units",
    description:
      "Premium BIB bags manufactured through automated processing with full quality tracking.",
    features: [
      "Sizes 1–25 L, custom sizes",
      "Eco-friendly materials",
      "Many spout options",
      "Optional color printing",
    ],
    images: ["/media/HB_bags24.jpg", "/media/CustomMadeBags20.jpg", "/media/diary_valves.jpg"],
  },
  {
    id: "high-barrier-laminates",
    title: "Wide Thermo-laminated High-Barrier Film",
    category: "Thermo-Laminated Film",
    price: "Custom quote",
    minOrder: "1,000 meters",
    description:
      "2400 mm custom thermo-lamination with high-barrier structures for food/chemicals/electronics.",
    features: [
      "Customized barrier & thickness",
      "Eco-friendly processing/materials",
      "Fully-tracked manufacturing",
    ],
    images: ["/media/mPet_TL.jpg"],
  },
];
