import { Link } from 'react-router-dom';

export interface SeoStat {
  label: string;
  value: string;
}

export interface SeoSection {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  points?: string[];
  image?: {
    src: string;
    alt: string;
  };
  stats?: SeoStat[];
}

export interface SeoHero {
  eyebrow?: string;
  title: string;
  subtitle: string;
  stats?: SeoStat[];
}

export interface SeoRelatedLink {
  label: string;
  to: string;
  description?: string;
}

export interface SeoCta {
  title: string;
  description: string;
  buttonLabel: string;
  buttonTo: string;
}

interface SeoPageLayoutProps {
  hero: SeoHero;
  sections: SeoSection[];
  relatedLinks?: SeoRelatedLink[];
  cta?: SeoCta;
}

const SeoPageLayout = ({ hero, sections, relatedLinks, cta }: SeoPageLayoutProps) => {
  return (
    <div className="pt-20 bg-white">
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {hero.eyebrow && (
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                {hero.eyebrow}
              </span>
            )}
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900">
              {hero.title}
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              {hero.subtitle}
            </p>
            {hero.stats && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                {hero.stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="py-16 border-b border-gray-100 scroll-mt-24"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                {section.eyebrow && (
                  <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                    {section.eyebrow}
                  </p>
                )}
                <h2 className="text-3xl font-bold text-gray-900">
                  {section.title}
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {section.description}
                </p>
                {section.points && (
                  <ul className="mt-6 space-y-3 text-gray-600">
                    {section.points.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.stats && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {section.stats.map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {section.image && (
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={section.image.src}
                    alt={section.image.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      ))}

      {relatedLinks && relatedLinks.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-10">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">
                Explore More
              </p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900">
                Related Aseptic Packaging Topics
              </h3>
              <p className="mt-4 text-gray-600">
                Dive deeper into the technical guides and Answer Library built from our published market research and FAQ archive.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition"
                >
                  <p className="text-lg font-semibold text-gray-900">{link.label}</p>
                  {link.description && (
                    <p className="mt-2 text-sm text-gray-600">{link.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {cta && (
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-primary text-white p-10 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-semibold">{cta.title}</h3>
                <p className="mt-3 text-white/90">{cta.description}</p>
              </div>
              <Link
                to={cta.buttonTo}
                className="inline-flex items-center justify-center px-6 py-3 mt-6 md:mt-0 bg-white text-primary font-semibold rounded-lg shadow-md hover:bg-gray-100 transition"
              >
                {cta.buttonLabel}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SeoPageLayout;
